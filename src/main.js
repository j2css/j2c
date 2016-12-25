import {defaults, emptyArray, emptyObject, flatIter, freeze, type, FUNCTION} from './helpers'
import {closeSelectors, rules} from './rules'
import {declarations} from './declarations'
import {atRules} from './at-rules'
import {at, global, kv} from './extras'


export default function j2c() {

  // the buffer that accumulates the output. Initialized in `$sink.i()`
  var buf

  // the bottom of the 'codegen' stream. Mirrors the `$filter` plugin API.
  var $sink = {
    init: function(){buf=[]},
    done: function (raw) {return raw ? buf : buf.join('')},
    atrule: function (rule, kind, param, takesBlock) {
      buf.push(rule, param && ' ', param, takesBlock ? ' {' : ';', _instance.endline)
    },
    // close atrule
    _atrule: function ()         {buf.push('}', _instance.endline)},
    rule: function (selector)    {buf.push(selector, ' {', _instance.endline)},
    // close rule
    _rule: function ()           {buf.push('}', _instance.endline)},
    decl: function (prop, value) {buf.push(prop, prop && ':', value, ';', _instance.endline)}
  }

  // holds the `$filter` and `$at` handlers
  var $filters = [closeSelectors]
  var $atHandlers = []

  // the public API (see the main docs)
  var _instance = {
    at: at,
    global: global,
    kv: kv,
    names: {},
    endline: '\n',
    suffix: '__j2c-' +
      // 128 bits of randomness
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return _instance
    },
    $plugins: [],
    sheet: function(tree) {
      var emit = _createOrRetrieveStream(0)
      emit.init()
      rules(
        _walkers[0],
        emit,
        '', // prefix
        tree,
        1,  // local, by default
        0   // inAtRule
      )

      return emit.done()
    },
    inline: function (tree, options) {
      var emit = _createOrRetrieveStream(1)
      emit.init()
      declarations(
        _walkers[1],
        emit,
        '', // prefix
        tree,
        !(options && options.global)   // local, by default
      )
      return emit.done()
    }
  }

  // The `state` (for the core functions) / `walker` (for the plugins) tables.
  var _walkers = [
    // for j2c.sheet
    {
      // helpers for locaizing class and animation names
      localizeReplacer: _localizeReplacer, // second argument to String.prototype.replace
      localize: _localize,                 // mangles local names
      names: _instance.names,              // local => mangled mapping
      $atHandlers: $atHandlers,            // extra at-rules
      // The core walker methods, to be provided to plugins
      atrule: atRules,
      decl: declarations,
      rule: rules
    },
    // likewise, for j2c.inline (idem with `$a`, `a` and `s` removed)
    {
      localizeReplacer: _localizeReplacer,
      localize: _localize,
      names: _instance.names,
      decl: declarations
    }
  ]


  // inner helpers

  var _use = flatIter(function(plugin) {
    // `~n` is falsy for `n === -1` and truthy otherwise.
    // Works well to turn the  result of `a.indexOf(x)`
    // into a value that reflects the presence of `x` in
    // `a`.
    if (~_instance.$plugins.indexOf(plugin)) return

    _instance.$plugins.push(plugin)

    if (type.call(plugin) === FUNCTION) plugin = plugin(_instance)

    if (!plugin) return

    flatIter(function(filter) {
      $filters.push(filter)
    })(plugin.$filter || emptyArray)

    flatIter(function(handler) {
      $atHandlers.push(handler)
    })(plugin.$at || emptyArray)

    defaults(_instance.names, plugin.$names || emptyObject)

    _use(plugin.$plugins || emptyArray)

    $sink = plugin.$sink || $sink

    defaults(_instance, plugin)
  })


  var _streams = []
  /**
   * returns the codegen streams, creating them if necessary
   * @param
   */
  function _createOrRetrieveStream(inline) {
    // build the stream processors if needed
    if (!_streams.length) {
      // append the $sink as the ultimate filter
      $filters.push(function(_, inline) {return inline ? {init:$sink.init, decl:$sink.decl, done:$sink.done} : $sink})
      for(var i = 0; i < 2; i++){ // 0 for j2c.sheet, 1 for j2c.inline
        for (var j = $filters.length; j--;) {
          _streams[i] = freeze(
            defaults(
              $filters[j](_streams[i], !!i),
              _streams[i]
            )
          )
        }
      }
    }
    return _streams[inline]
  }

  /**
   * Returns a localized version of a given name.
   * Registers the pair in `instnace.name` if needed.
   *
   * @param {string} name - the name to localize
   * @return {string} - the localized version
   */
  function _localize(name) {
    if (!_instance.names[name]) _instance.names[name] = name + _instance.suffix
    return _instance.names[name].match(/^\S+/)
  }

  /**
   * Used as second argument for str.replace(localizeRegex, replacer)
   * `ignore`, `global` and `(dot, name)` are mutually exclusive
   *
   * @param {string} match - the whole match (ignored)
   * @param {string|null} ignore - a comment or a string literal
   * @param {string|null} global - a global name
   * @param {string|null} dot - either '.' for a local class name or the empty string otherwise
   * @param {string|null} name - the name to localize
   * @return {string}
   */
  function _localizeReplacer(match, ignore, global, dot, name) {
    return ignore || global || dot + _localize(name)
  }

  return _instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})