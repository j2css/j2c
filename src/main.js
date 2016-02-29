import {own, flatIter, emptyArray, type, FUNCTION, OBJECT} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'
import {atRules} from './at-rules'

function global(x) {
  return ':global(' + x + ')'
}


function kv (k, v, o) {
  o = {}
  o[k] = v
  return o
}

function at (rule, params, block) {
  if (
    arguments.length < 3
  ) {
    // inner curry!
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    // So that it can be used as a key in an ES6 object literal.
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule +' ' + params, block)
}

export default function j2c() {
  //
  var filters = [function(next) {
    var lastSelector
    return {
      i: function(){lastSelector = 0; next.i()},
      x: function (raw) {
        if (lastSelector) {next.S(); lastSelector = 0}
        return next.x(raw)
      },
      a: function (rule, param, takesBlock) {
        if (lastSelector) {next.S(); lastSelector = 0}
        next.a(rule, param, takesBlock)
      },
      A: function (rule) {
        if (lastSelector) {next.S(); lastSelector = 0}
        next.A(rule)
      },
      s: function (selector) {
        if (selector !== lastSelector){
          if (lastSelector) next.S()
          next.s(selector)
          lastSelector = selector
        }
      },
      d: next.d
    }
  }]
  var atHandlers = []
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

  function _default(target, source) {
    for (var k in source) if (own.call(source, k) && k.indexOf('$')) {
      if (OBJECT == type.call(source[k]) && OBJECT == type.call(target[k])) _default(target[k], source[k])
      else if (!(k in target)) target[k] = source[k]
    }
  }

  var buf
  var $sink = {
    i: function(){buf=[]},
    x: function (raw) {return raw ? buf : buf.join('')},
    a: function (rule, argument, takesBlock) {
      buf.push(rule, argument && ' ',argument, takesBlock ? ' {\n' : ';\n')
    },
    A: function ()            {buf.push('}\n')},
    s: function (selector)    {buf.push(selector, ' {\n')},
    S: function ()            {buf.push('}\n')},
    d: function (prop, value) {buf.push(prop, prop && ':', value, ';\n')}
  }
  var streams = []

  var parsers = [
    {
      $a: atHandlers,
      a: atRules,
      d: declarations,
      l: localize,
      n: instance.names,
      s: sheet
    }, {
      d: declarations,
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
      filters.push(filter)
    })(plugin.$filter || emptyArray)

    flatIter(function(handler) {
      atHandlers.push(handler)
    })(plugin.$at || emptyArray)

    $sink = plugin.$sink || $sink

    _default(instance, plugin)
  })

  function getStream(inline) {
    if (!streams.length) {
      for(var i = 0; i < 2; i++){
        filters[filters.length - i] = function(_, inline) {return inline ? {i:$sink.i, d:$sink.d, x:$sink.x} : $sink}
        for (var j = filters.length; j--;) streams[i] = filters[j](streams[i], !!i, parsers[i])
      }
    }
    var res = streams[inline]
    return res
  }

  function localize(match, global, dot, name) {
    if (global) return global
    if (!instance.names[name]) instance.names[name] = name + instance.suffix
    return dot + instance.names[name].match(/^\S+/)
  }

  localize.a = atHandlers

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