import {Default, emptyArray, emptyObject, flatIter, freeze, type, FUNCTION} from './helpers'
import {closeSelectors, rules} from './rules'
import {declarations} from './declarations'
import {atRules} from './at-rules'
import {at, global, kv} from './extras'


export default function j2c() {

  // palceholder for the buffer used by the `$sink` handlers
  var buf

  // the bottom of the 'codegen' stream. Mirrors the `$filter` plugin API.
  var $sink = {
    // Init
    i: function(){buf=[]},
    // done (eXit)
    x: function (raw) {return raw ? buf : buf.join('')},
    // start At-rule
    a: function (rule, argument, takesBlock) {
      buf.push(rule, argument && ' ',argument, takesBlock ? ' {' : ';', _instance.endline)
    },
    // end At-rule
    A: function ()            {buf.push('}', _instance.endline)},
    // start Selector
    s: function (selector)    {buf.push(selector, ' {', _instance.endline)},
    // end Selector
    S: function ()            {buf.push('}', _instance.endline)},
    // declarations
    d: function (prop, value) {buf.push(prop, prop && ':', value, ';', _instance.endline)}
  }

  var $filters = [closeSelectors]
  var $atHandlers = []

  var _instance = {
    at: at,
    global: global,
    kv: kv,
    names: {},
    endline: '\n',
    suffix: '__j2c-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return _instance
    },
    $plugins: []
  }

  var _streams = []

  // The `state` (for the core) / `walker` (for the plugins) tables.

  var _walkers = [
    // for j2c.sheet
    {
      // helpers for locaizing class and animation names
      L: _localizeReplacer, // second argument to String.prototype.replace
      l: _localize,         // mangles local names
      n: _instance.names,    // local => mangled mapping
      $a: $atHandlers,      // extra at-rules
      // The core walker methods, to be provided to plugins
      a: atRules,
      d: declarations,
      r: rules
    },
    // likewise, for j2c.inline (idem with `$a`, `a` and `s` removed)
    {
      L: _localizeReplacer,
      l: _localize,
      n: _instance.names,
      d: declarations
    }
  ]


  // The main API functions

  _instance.sheet = function(tree) {
    var emit = _getStream(0)
    emit.i()
    rules(
      _walkers[0],
      emit,
      '',    // prefix
      tree,
      1,      // local, by default
      0     // inAtRule
    )

    return emit.x()
  }

  _instance.inline = function (tree) {
    var emit = _getStream(1)
    emit.i()
    declarations(
      _walkers[1],
      emit,
      '',         // prefix
      tree,
      1           //local
    )
    return emit.x()
  }

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

    Default(_instance.names, plugin.$names || emptyObject)

    _use(plugin.$plugins || emptyArray)

    $sink = plugin.$sink || $sink

    Default(_instance, plugin)
  })

  function _getStream(inline) {
    if (!_streams.length) {
      for(var i = 0; i < 2; i++){
        $filters[$filters.length - i] = function(_, inline) {return inline ? {i:$sink.i, d:$sink.d, x:$sink.x} : $sink}
        for (var j = $filters.length; j--;) {
          _streams[i] = freeze(Default(
            $filters[j](_streams[i], !!i, _walkers[i]),
            _streams[i]
          ))
        }
      }
    }
    var res = _streams[inline]
    return res
  }

  function _localize(name) {
    if (!_instance.names[name]) _instance.names[name] = name + _instance.suffix
    return _instance.names[name].match(/^\S+/)
  }

  function _localizeReplacer(match, string, global, dot, name) {
    if (string || global) return string || global
    return dot + _localize(name)
  }

  return _instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})