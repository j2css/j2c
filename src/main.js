import {_default, emptyArray, emptyObject, flatIter, freeze, type, FUNCTION} from './helpers'
import {closeSelectors, sheet} from './sheet'
import {declarations} from './declarations'
import {atRules} from './at-rules'
import {at, global, kv} from './extras'


export default function j2c() {
  var $filters = [closeSelectors]
  var $atHandlers = []
  var instance = {
    at: at,
    global: global,
    kv: kv,
    names: {},
    suffix: '__j2c-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return instance
    },
    $plugins: []
  }

  var buf
  var $sink = {
    // Init
    i: function(){buf=[]},
    // done (eXit)
    x: function (raw) {return raw ? buf : buf.join('')},
    // start At-rule
    a: function (rule, argument, takesBlock) {
      buf.push(rule, argument && ' ',argument, takesBlock ? ' {\n' : ';\n')
    },
    // end At-rule
    A: function ()            {buf.push('}\n')},
    // start Selector
    s: function (selector)    {buf.push(selector, ' {\n')},
    // end Selector
    S: function ()            {buf.push('}\n')},
    // declaration
    d: function (prop, value) {buf.push(prop, prop && ':', value, ';\n')}
  }
  var streams = []

  var parsers = [
    {
      $a: $atHandlers,
      a: atRules,
      d: declarations,
      L: localizeReplacer,
      l: localize,
      n: instance.names,
      s: sheet
    }, {
      d: declarations,
      L: localizeReplacer,
      l: localize,
      n: instance.names
    }
  ]

  var _use = flatIter(function(plugin) {
    // `~n` is falsy for `n === -1` and truthy otherwise.
    // Works well to turn the  result of `a.indexOf(x)`
    // into a value that reflects the presence of `x` in
    // `a`.
    if (~instance.$plugins.indexOf(plugin)) return

    instance.$plugins.push(plugin)

    if (type.call(plugin) === FUNCTION) plugin = plugin(instance)

    if (!plugin) return

    flatIter(function(filter) {
      $filters.push(filter)
    })(plugin.$filter || emptyArray)

    flatIter(function(handler) {
      $atHandlers.push(handler)
    })(plugin.$at || emptyArray)

    _default(instance.names, plugin.$names || emptyObject)

    _use(plugin.$plugins || emptyArray)

    $sink = plugin.$sink || $sink

    _default(instance, plugin)
  })

  function getStream(inline) {
    if (!streams.length) {
      for(var i = 0; i < 2; i++){
        $filters[$filters.length - i] = function(_, inline) {return inline ? {i:$sink.i, d:$sink.d, x:$sink.x} : $sink}
        for (var j = $filters.length; j--;) {
          streams[i] = freeze(_default(
            $filters[j](streams[i], !!i, parsers[i]),
            streams[i]
          ))
        }
      }
    }
    var res = streams[inline]
    return res
  }

  function localize(name) {
    if (!instance.names[name]) instance.names[name] = name + instance.suffix
    return instance.names[name].match(/^\S+/)
  }

  function localizeReplacer(match, string, global, dot, name) {
    if (string || global) return string || global
    return dot + localize(name)
  }

/*/-statements-/*/
  instance.sheet = function(tree) {
    var emit = getStream(0)
    emit.i()
    sheet(
      parsers[0],
      emit,
      '',    // prefix
      tree,
      1,      // local, by default
      0     // inAtRule
    )

    return emit.x()
  }
/*/-statements-/*/
  instance.inline = function (tree) {
    var emit = getStream(1)
    emit.i()
    declarations(
      parsers[1],
      emit,
      '',         // prefix
      tree,
      1           //local
    )
    return emit.x()
  }

  return instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})