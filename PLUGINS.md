# `j2c` Plugin author notes

A plugin can be an object, a function or an array of zero or more plugins (nested arrays are thus supported).

The plugins can only be registered when a j2c instance is created using `var j2c = new J2c({plugins: [plugin]})

If a plugin is a function, it receives the `j2c` instance that's being built (and it can modify it). It may return an object, to be treated as an object plugin.

An object plugin is a JS object with one or more of the following fields: `atrule`, `filter` and `sink`.

## Overview of the types of plugins

`j2c` is at heart a simple compiler made of a frontend and a backend. 

- The frontend that walks a JS objects/arrays tree (as if it were an AST) and calls the backend when necessary to emit atrules, rules and declarations.

- The default backend fills a buffer with strings and `join()`s them on completion.

`j2c` plugin can either tap into the frontend (by implementing custom at-rules), and replace or augment the backend, thhrough middleware filters.

We'll process backwards and start by describing the backend API, since its understanding is a prerequisite to write filters and may be useful for custom at-rules too.

## `sink` plugins: replace the very end of the backend

A `j2c` backend must provide the following API:

```JS
{
    init() {},
    // called on `j2c.sheet()/j2c.inline()` invocations before 
    // the sheet is processed.
    done() {},
    // when the tree traversal is finished, to finalize
    // the style sheet
    err(message) {},
    // when an error is noticed, allows to display errors
    // in context.
    raw(txt) {},
    // inserts `txt` as is into the buffer
    decl(property, value),
    // inserts a declaration into the sheet
    rule(selector) {},
    // opens a rule with a given selector
    _rule() {},
    // signals the end of a ruleset
    atrule(name, kind, param, block)
    // when an atrule is encountered.
    // `name` is the rule name in full includin the '@' and the
    // prefix when there's one. e.g. '@-webkit-keyframes'
    // `kind` is the type of at-rule, without '@' nor prefix
    // e.g. 'keyframes'
    // `param` is the optional parameter
    // `block` is a tells whether the at-rule takes a block or
    // not. Values:
    //  - falsy for @namespace, @charset and @import
    //  - 'decl' if the block contains declarations like @font-face
    //  - 'rule' if the block contains rules like @media or @keyframes
    _atrule(){}
    // called to signal the end of an atrule block
}
```

`j2c.inline()` uses the same API but restricted to `init()`, `done()`, `err(msg)` and `decl(property, value)`.

As mentioned above, The default sink pushes the various arguments into a buffer and `.join()`s it on `done()` and returns the resulting string. Smarter sinks that deduplicate rules or insert them one at a time using sheet.insertRule() on the fly for speed.

A filter plugin is an object with a `sink` property whose value is a function that returns an array of one or two backends. The first backend is intended for `j2c.sheet()`, the second, optional, for `j2c.inline()`. In the absence of a second sink `j2c` creates one out of the methods of the first one (`init`, `done`, `err`, `raw` and `decl`).
The function is called once when a `j2c` instance is created.

### Example

The following sink will produce a string with CSS indented by 4 spaces:

```JS
export const prettySink = {sink: function(){
  var buf, err, indent
  return [{
    init: function(){buf=[], err=0, indent = ''},
    done: function (raw) {
      if (err) throw new Error('j2c error, see below\n' + buf.join(''))
      return raw ? buf : buf.join('')
    },
    err: function(msg) {
      err = 1
      buf.push('/* +++ ERROR +++ ' + msg + ' */\n')
    },
    raw: function(txt) {
      buf.push(txt, '\n')
    },
    atrule: function(rule, kind, param, takesBlock) {
      buf.push(indent, rule, param && ' ', param, takesBlock ? ' {' : ';', '\n')
      if (takesBlock) indent = indent + '    '
    },
    // close atrule
    _atrule: function() {
      indent = indent.slice(4)
      buf.push(indent, '}', '\n')
    },
    rule: function(selector) {
      buf.push(indent, selector, ' {', '\n')
      indent = indent + '    '
    },

    // close rule
    _rule: function() {
      indent = indent.slice(4)
      buf.push(indent, '}', '\n')
    },
    decl: function (prop, value) {buf.push(indent, prop, prop && ': ', value, ';', '\n')}
  }]
}}
```

## `filter` plugins: augment a backend.

a filter plugin receive the next backend as an arguement and return a new one, augmented with some capabilites. The filter methods must call the methods of the backend it recieved as an arguement. The methods are optional. When a method is missing `j2c` automatically defers to the next one.

It is made of an object with a `filter` property whose value is a function that takes two parameters: `next` and `inline`. `next` is the next part of the backend (a `sink`, possibly augmented by previous filters). `inline` is truthy for `j2c.inlne()` filters and falsy for `j2c.sheet()` filters. The plugin function is called twice when the `j2c` instance is created, once for `inline` and once for `sheet`. The fields of its return value should not be mutated once the wrapper function has returned.

Example

Here's a simple filter that makes each declaration `!important`

```JS
export const importantFilter = {filter: function(next) {
    return {
        decl: function(prop, value) {
            next.decl(
                prop,
                /!important$/.test(value) 
                ? value 
                : value + ' !important'
            )
        }
    }
}}
```

Calling the next methods rather than returning values has advantages and drawbacks. On the pro side:

- it allows to forward more than one value without allocating anything on the heap.
- it allows to call the next method several times (the prefix plugin, turns `flex-flow:...` into `-webkit-box-direction:...` plus `-webkit-box-orient:...` by calling `next.decl()` twice, for example).
- it allows to buffer the calls and re-create an AST, as done by the PostCSS plugin. The various methods of the filter build a tree. On `done()`, the PostCSS processor is called and the resulting tree is walked. The walkers then call the `next.x` handlers.
- The functions are generally small and can be inlined by the JIT compilers.

The main drawback is that it allows one to call the `next` function in an incorrect order and to produce an invalid style sheet.

## `atrule` plugins.

`atrule` plugins allow one to handle custom at-rules that take precedence over the default ones.

An `atrule` plugin is an object with a `atrule` property whose value is a function with the following signature:

```JS
function atrulePlugin(
    frontend,
    backend,
    rule,
    argOrBlock,
    selectorPrefix,
    local,
    nestingDepth
):bool {}
```

If it should return `true` if it handled the rule it was given and `false` otherwise.

- `frontend` is the current frontend object, equipped with `atrule()`, `rule()` `decl()` methods to walk sub-trees; a `localize()` method that registers a new local name an returns it mangled, a `localizeReplacer` used as a second argument to `aString.replace(regexp, replacer)` and a `names` object that contains the plain => mangled local names mapping. Most of these are pretty complex an would require a section of their own. In the mean time, you can have a look at the `src/at-rules.js`, `src/rules.js` and `src/declarations.js` files for a sample of their use.

- `backend` is the backend whose methods are described in the `sink` section.

- `[match, name, kind, param] = rule` is an array, the result of a regexp match. For example, `"@-webkit-keyframes foo"` will map to `["@-webkit-keyframes foo", "@-webkit-keyframes", "keyframes", "foo"]`, and `"@namespace"` will map to `["@namespace", "@namespace", "namespace", ""]`.

- `argOrBlock` is either the argument for at-rules that don't take blocks: `@import`, `@namespace` and `@charset`, or the nested block for rules that take one (all of the others).

- `selectorPrefix` is the selector at this point in the tree. Since `j2c` supports nested selectors and at-rules, the final selector emitted by `backend.rule()` may be longer, augmented by sub-selectors defined in the `argOrBlock` sub-tree.

- `local` is a boolean true when we are in local scope, false otherwise

- `nestingDepth` is a number that reflects how deep we are in the tree. 0 at the root, then incremented at each level. Arrays in the tree don't increment the depth.