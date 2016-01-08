# j2c

[![Join the chat at https://gitter.im/j2css/j2c](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/j2css/j2c?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A tiny CSS in JS solution. 1.45 KiB mingzipped.

Supports local classes by default, mixins and extensions, at-rules and nested selectors. Composable. Extensible.

Advanced CSS features, like nested conditional at-rules (anywhere in the stylesheet, like SASS), `@namespace`, `@font-face`, `@keyframes` (with automatic `@-webkit-keyframes`) are present out of the box.

The [home page](http://j2c.py.gy) has a few interactive demos.

[![Build Status](https://travis-ci.org/j2css/j2c.svg?branch=master)](https://travis-ci.org/j2css/j2c)
[![Coverage Status](https://coveralls.io/repos/j2css/j2c/badge.svg?branch=master)](https://coveralls.io/r/j2css/j2c?branch=master)
[![Dependency Status](https://david-dm.org/j2css/j2c.svg)](https://david-dm.org/j2css/j2c)
[![bitHound Score](https://www.bithound.io/github/j2css/j2c/badges/score.svg)](https://www.bithound.io/github/j2css/j2c/)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [For inline decalrations: `j2c.inline(declarations)`](#for-inline-decalrations-j2cinlinedeclarations)
    - [Arrays](#arrays)
      - [Overloading properties](#overloading-properties)
      - [Mixins](#mixins)
    - [Vendor prefixes:](#vendor-prefixes)
  - [For building a style sheet: `j2c.sheet(rules)`](#for-building-a-style-sheet-j2csheetrules)
    - [Telling selectors and properties apart](#telling-selectors-and-properties-apart)
    - [Combining multiple selectors](#combining-multiple-selectors)
    - [At-rules](#at-rules)
    - [Mixins and @extend](#mixins-and-extend)
    - [CSS Hacks](#css-hacks)
- [Inserting a stylesheet in a document](#inserting-the-stylesheet-in-the-document)
- [Limitations](#limitations)
- [TODO](#todo)
- [License: MIT](#license-mit)

----

## Installation

```Bash
$ npm install j2c
```

then

```JavaScript
var j2c = require('j2c')
```

There are also separate builds for `AMD`, `ES6` and a global `window.j2c` in the `dist` directory.

## Usage

`j2c` can be used to either assemble inline declarations or full style sheets with, by default, locally unique class names.

Like SASS LESS and Stylus, `j2c` supports nested at-rules and selectors, and mixins.

Here's an example of locallized class names (as pioneered AFAIK by [JSS](https://github.com/jsstyles/jss)):

```JavaScript
sheet = j2c.sheet({
  ".title": {
    font_size: "3rem",
    "&:before": {
      color: "#00b",
      content: "'#'"
    }
  },
  ".content": {
    line_height: "1.6em",
    padding: "2rem"
  }
});
```

Unique class names are generated automatically for `title` and `content`:

```CSS
.content_j2c_fvp6zc2gdj35evhsl73ffzq_0 {
    line-height: 1.6em;
    padding: 2rem;
}

.title_j2c_fvp6zc2gdj35evhsl73ffzq_0 {
    font-size: 3rem;
}

.title_j2c_fvp6zc2gdj35evhsl73ffzq_0:before {
    content: '#';
    color: #888;
}
```

`sheet` is now a `String` object with a `title` and `content` properties that hold the unique class names. It can be used like this in your view, either on the server, in the browser of for isomorphic apps (let's say this is part of a React view):

```Haml
<div>
  <style>{sheet}</style>
  <h3 class="{sheet.title}">Hello</h3>
  <div class="{sheet.content}">Foo bar baz...</div>
</div>
```

The `<style>{sheet}</style>` construct works in modernish browsers (ie9+). For older IE, see [below](#inserting-the-stylesheet-in-the-document).

Animation names are also "localized" by default, font names are left untouched.

### For inline decalrations: `j2c.inline(declarations)`

The `j2c` function takes in JS objects and builds a `property:value;` list out of it.

```JavaScript
j2c.inline({
  backgroundColor:"red",
  border: {
    top$left: {
      width: "1px",
      color: "white"
    }
  }
})
```

Outputs, as you could expect (white space added for readability):

```CSS
background-color: red;
border-top-color: white;
border-top-width: 1px;
border-left-color: white;
border-left-width: 1px;
```

`CamelCase` and `_snake_case` names are turned into `-dash-case`, so that property names can be left unquoted in the source.

Combine (sub)properties who share the same value using `$` as a separator. It is useful to specify vendor prefixes.

#### Property ordering

Provided you don't delete and re-add properties to your objects, the properties will end up in the CSS sheet in the source order.

#### Arrays for value overloading and mixins

You can sneak in arrays anywhere in the source tree. It enables many advanced techniques, like:

##### Overloading properties

If you want to overload a property by using an array at the value level

```JavaScript
j2c.inline({
    border_color: ["#33e", "rgba(64,64,255,0.8)"],
})
```

becomes

```CSS
border-color:#33e;
border-color:rgba(64,64,255,0.8);
```

Alternatively:

```JavaScript
j2c.inline([
  { border_color: "#33e"},
  { border_color: "rgba(64,64,255,0.8)"}
])
```

and

```JavaScript
j2c.inline({
    border:[
      {color: "#33e"},
      {color: "rgba(64,64,255,0.8)"}
    ]
})
```

will give the same result.

##### Mixins

You can mix in properties by using a function call in an array:

```JavaScript
function mixin(color) {
  return {
    border_color: color,
    color: color
  }
}

j2c.inline([
  mixin("red"),
  {
    font_size:"2em"
  }
])
```

```CSS
'color:red;
border-color:red;
font-size:2em;'
```

The mixin could also be a plain JS object if it doesn't need to be customized.

### For building a style sheet: `j2c.sheet(rules)`

Everything found in the `inline` section applies here too, I recommend you read it first.

To give you a taste of what can be done in j2c, here's a first, rather advanced example.

```JavaScript
s = j2c.sheet({
    "ul.foo": {
        "@media condition": {
            color: "red"
        },
        // properties for the main ul.my_root_class elements
        font: {
            size: "2em",
            family: "sans-serif"
        },
        // underscores in property names are converted to dashes.
        background_color: "#44f",
        // CamelCase is also automatically handled.
        borderRadius:"2px",

        // sub-selector for children element, notice the mandatory initial space
        // signifying a child element.
        " li": {
            padding:{
                left: "5px",
                top: "10px"
            },
            // convenient $ shortcut.
            border: {left$right: {width: "2px"}}
        }
    }
})
```

Output (after indentation):

```CSS
ul.foo_j2c_fgdl0s2a5fmle5g56rbuax71_0 li{
  padding-left:5px;
  padding-top:10px;
  border-left-width:2px;
  border-right-width:2px;
}
ul.foo_j2c_fgdl0s2a5fmle5g56rbuax71_0{
  font-size:2em;
  font-family:sans-serif;
  background-color:#44f;
}
@media condition{
  ul.foo_j2c_fgdl0s2a5fmle5g56rbuax71_0{
    color:red;
  }
}
```

Were `s.foo === "foo_j2c_fgdl0s2a5fmle5g56rbuax71_0 "`

#### Selector syntax (telling then and properties apart)

tl;dr: always prefix element selectors with a space.

`j2c` considers that an object key matching `/^[-_0-9A-Za-z$]+$/` is a property, and everything else is a (sub-)selector. Since underscores are converted to dashes, it means that property names can be left unquoted in the source, while (sub-)selectors have to be quoted.

White space in selectors is significant. `{".foo": {".bar":{...}}}` applies to `.foo.bar` while

Element selectors like `p` or `body` match the property pattern and must thus be preceded by a space.

Selectors are concatenated as is, while properties are concatenated with hyphens. `{" ul": {" li": {padding: {left:10}}}}` becomes ` ul li{padding-left:10px;}`. `{" p":{".foo":{color:"red"}}}`, is translated to ` p.foo:{color:red;}`.

The properties at a given selector level are guaganteed to appear in the CSS output before the ones of sub-selectors and before those present in nested @-rules.

#### Global class and animation names.

You can define or refer to global names using the `@global{}` pseudo at-rule, and the `:global()` function. This will thus preserve the `.foo`, `.bar` and `baz` names:

```JavaScript
s = j2c.sheet({
    "@global": {
        "ul.foo": {
            font_size: "2em",
        }
    },
    "p:global(.bar)" :{
        color:"#f00",
        animation_name: ":global(baz)"
    },
    "@keyframes :global(baz)": {
        // define the global "baz" animation here.
    }
})
```

`@global` blocks also globalize animation names (not shown above).

#### Combining multiple selectors

TODO: refactor this section to mention the SASS-like `&` placeholder (at any arbitrary position).

Here's a excerpt from the `j2c` port of the [PocketGrid](https://github.com/arnaudleray/pocketgrid/blob/44aa1154a56b11a852f7252943f265028c28f056/pocketgrid.css).

```JavaScript
j2c.sheet({"@global": {
  ".block,.blockgroup":{
    ",:before,:after":{          // Notice the initial coma.
      box_sizing:"border-box"
    }
  }
}})
```

Nesting `",:before,:after"` inside the `".block,.blockgroup"` block combines `[".block", ".blockgroup"]` with `["", ":before", ":after"]`, giving

```CSS
.block,.block:before,.block:after,.blockgroup,.blockgroup:before,.blockgroup:after{
    box-sizing:border-box;
}
```

Mathy folks call this as a Cartesian product.

#### At-rules

`j2c` handles @-rules out of the box, including nested ones.

```JavaScript
j2c.sheet({
  "@media screen": {
    " p": {
      foo:"bar",
      "@media (orientation: landscape)": {
        baz:"qux"
      }
    }
  }
})
```

becomes

```CSS
@media screen {
  p {
    foo: bar;
  }
  @media (orientation: landscape) {
    p {
      baz: qux;
    }
  }
}
```

For `@keyframes` rules, a `@-webkit-keyframes` block is automatically created with auto-prefixed property names.

At-rules are guarateed to be inserted after the properties and sub-selectors at a given level. This prevents nested `@media` blocks to be overridden by declarations found out of them.

If you need several media queries where the order of definition is important, or if you need at-rules that must be inserted at the top of a sheet, use arrays.

```JavaScript
j2c.sheet([
  {"@import": "url(foo.css)"},
  {"@namespace": "url(http://www.w3.org/1999/xhtml)"},
  {"@namespace": "svg url(http://www.w3.org/2000/svg)"},
  {
    ".your": {sheet:"here"}
  }
])
```

#### Mixins and `@extend`

Mixins and `@extend` make `j2c` sheets composable. Both techniques can be combined.

##### Mixins

For mixins, arrays works the same way at the selector level as they do at the property/value one. You can therefore use the [method described in the "inline" section](#mixins) to create mixins, that can return either at-rules, selectors, properties or a mix thereof.

##### `@extend`

`j2c` also supports a SASS-like `@extend`, more powerful in some regards, but more limited in others.

The limitation is that it can only deal with classes. Specifically:

```JS
namespace = j2c.sheet({
  '.red': {color: '#f00'}
})

sheet = j2c.sheet(namespace, {
  '.great': {
    fontSize: '3em'
  },
  '.greatRed': {
    '@extend': ['.great', '.red'] // you can also pass a single class
  }
})
```

`sheet.greatRed` is now defined as `'great_j2c...  red_j2c...  greatRed_j2c...'` (class names truncated for readability).

The extra power comes from the fact that you can inherit from arbitrary classes, not just j2c-defined ones:

```JS
sheet = j2c.sheet(namespace, {
  '.myButton': {
    '@extend': ':global(.button)', // coming, say, form Bootstrap
    color: theme.highlight
  }
})
```

Here, `sheet.myButton` is `'button  myButton_j2c...'`.

While `@extend` can import from arbitrary classes, it only imports into local ones.

`@extend` works fine with nested selectors. If there are more than one class in a selector, `@extend` applies to the last (right-most) one.

###### Invalid uses

If the last or only selector is a `:global(.klass)`, in `@global` context, or in the absence of a class in the selector, `@extend` is turned into a `at-extend` property and inserted as-is in the sheet.

#### CSS Hacks

Since `j2c.sheet` only accepts property names that match `/^[-_0-9A-Za-z$]+$/`, it is not possible to express CSS hacks using objects. You can, however, work around the issue by using arrays and strings instead.

Here's another modified excerpt from the PocketGrid port:

```JavaScript
j2c.sheet({
  ".blockgroup": [
    "*zoom: 1; /* hackety hackery */",
    {
      "list-style-type":"none",
      padding:0,
      margin:0
    }
  ]
})
```

Array elements are inserted in sequence, and string literals are treated as a list of properties, and inserted as is.

Result:

```CSS
.blockgroup{
*zoom: 1; /* hackety hackery */
}
.blockgroup{
  list-style-type:none;
  padding:0;
  margin:0;
}
```

You can also pass th result of `j2c.inline` which is less picky about property names.

## Vendor prefixes:

_Note: The prefix story in `j2c` is currently sub-optimal. I hope at some point to port prefixfree as a plugin. It is already small, and half of it isn't needed for `j2c` (the half that deals with finding and updating style elements in the DOM)._

### Prefixing property names

You can specify the prefixes by hand using the "$" operator where needed:

```JavaScript
j2c.inline({
  // Notice the trailing dollar, required for the unprefixed property.
  _o$_ms$_moz$_webkit$: {foo: "bar"},
  hello: "world"
});
```

Compiles to

```CSS
p {
  -o-foo:bar;
  -ms-foo:bar;
  -moz-foo:bar;
  -webkit-foo:bar;
  foo:bar;
  hello:world;
}
```


### Prefixing values

`/!\` This will be replaced by a plugin in a future version.

To prefix values, you can use `j2c.prefix`:

```JavaScript
j2c.inline({
  background_image:j2c.prefix(
    "linear-gradient(90deg, #f00, #ff0)",
    ['moz','webkit']
  )
})
```

```CSS
background-image: -moz-linear-gradient(90deg, #f00, #ff0);
background-image: -webkit-linear-gradient(90deg, #f00, #ff0);
background-image: linear-gradient(90deg, #f00, #ff0);
```

There's no support for prefixing a list multiple values (e.g. `"linear-gradient(90deg, #f00, #ff0),linear-gradient(90deg, #f00, #ff0)"`).

### `@-webkit-keyframes`

`/!\` This will be replaced by a plugin in a future version.

`@keyframes` blocks automatically produce their `@-webkit-keyframes` counterparts, even in the absence of a vendor list argument.

## Inserting the stylesheet in the document

Foreword: Please note that the following is based on research on the Web, but not effectively tested in Internet explorer at the moment.

### ie9+

Add a text node to a new `style` element.

```JavaScript
var style = document.createElement('style');
style.type = 'text/css'; // my not even be needed
style.appendChild(document.createTextNode(sheet));
```

In frameworks:

```Handlebars
<style>{sheet}</style>
```

Sweet, innit?

### ie8+ (sheets up to 32k in ie8)

As above, but with a `link` element and a data URI.

```Handlebars
<link rel="stylesheet" itemprop="stylesheet" href="{'data:,' + encodeURIComponent(sheet)}" />
```

Note that ie8 has a 32k limit on the length of data URIs. It supports base 64 in data URIs, but doesn't provide `btoa`, which would not be useful in this context anyway, since base 64 encoded sheets are larger than URI encoded ones.

### ie6+ (unlimited sheet size)


```JavaScript
function stylize(element, sheet){
    element.type = 'text/css';
    if (element.styleSheet){
      element.styleSheet.cssText = sheet;
    } else {
      element.appendChild(document.createTextNode(sheet));
    }
    return element;
}
var el = document.createElement('style')
var sheet = j2c.sheet(...)
stylize(el, sheet);
document.head.appendChild(el);
```

For this to work in client-side frameworks, you need to grab a handle on the actual `<style>` DOM node. This means that you must create a custom component/directive.

Here are a few examples:

#### React:

```JavaScript
var j2cComponent = {
   render: function(){
        return <style />
    }
    componentDidMount: function(){
        stylize(React.findDOMNode(this), this.prop.sheet)
    }
}
```

#### Mithril:

```JavaScript
var j2cComponent = {
    view: function(ctrl, args) {
        return m("style", {
            sheet: args.sheet
            config: function(el, isinit, vdom) {
                if(!isinit) {
                    stylize(el, vdom.attrs.sheet);
                }
            }
        })
    }
}
```

#### Angular v1.3- (1.4 is ie9+, and support dynamic `<style>` tags).

```JavaScript
module.directive('j2cSheet', function() {
  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
        if (element.tagName.toUpperCase() !== "STYLE") throw 'j2cSheet expects a <style> element';
        stylize(element[0], attrs.j2cSheet);
    }
  };
});

module.directive('j2cInline', function() {
  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
        element[0].style += j2c.inline(attrs.j2cInline);
    }
  };
});
```

## Limitations

### Selectors and properties order

`j2c` relies on JS objects to define selectors and properties. The iteration order of object properties is officially undefined, but in practice it only differs in situations that do not really apply to `j2c`. As long as we're using non-numeric keys and we don't delete then re-add object properties, the iteration order is the output order.

### At rules order

At-rules, if present, are processed after selectors. This also applies to nested at-rules.

If you want an at-rule to appear in source before normal rules, you can use an array:

```JavaScript
j2c.sheet(
    [
      {
        "@namespace": "svg url(http://www.w3.org/2000/svg)"
      }, {
        "svg|a": {
          // ...
        }
      }
    ]
```

### No input validation

`j2c` knows the bare minimum to output a valid stylesheet when provided with valid input. It will hapily accept invalid selectors, properties and values, and could in that case produce a broken stylesheet.

I may get around and write a validator companion, but I'm not there yet :-).

### Little pretty printing

`j2c` puts each selector list and properties on their own lines, but doesn't indent or add other white space.

For debugging purposes, I recommend that you pipe `j2c`'s  output through a [[be](https://github.com/mattbasta/crass) [au](https://github.com/beautify-web/js-beautify) [ti](https://github.com/senchalabs/cssbeautify) [fier](http://csstidy.sourceforge.net/)] of your choice.

### Vendor prefixes corner cases

`j2c` doesn't provide any facility to auto-prefix a list of values. It is relevant in the context of multiple gradient backgrounds and `transition`/`transition-property` values.

## TODO:

- Improve the web site. Move the docs there.
- Test DOM insertion methods in old IE.

## License: MIT
