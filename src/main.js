import {own, flatIter, emptyArray, type, FUNCTION, OBJECT} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'

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
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule +' ' + params, block)
}

export default function j2c() {
  var filters = []
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
    })(plugin.$filter||[])

    _default(instance, plugin)
  })

  function makeEmitter(inline) {
    var buf = []
    function push() {
      emptyArray.push.apply(buf, arguments)
    }
    var emit = {
      x: function(raw){return raw ? buf : buf.join('')},   // buf
      a: push, // at-rules
      s: push, // selector
      d: push, // declaration
      c: push  // close
    }
    for (var i = filters.length; i--;) emit = filters[i](emit, inline)
    return emit
  }

  var state = {
    c: function composes(parent, child) {
      instance.names[child] = instance.names[child] + ' ' + parent
    },
    l: function localize(match, global, dot, name) {
      if (global) return global
      if (!instance.names[name]) instance.names[name] = name + instance.suffix
      return dot + instance.names[name].match(/^\S+/)
    }
  }

/*/-statements-/*/
  instance.sheet = function(statements, emit) {
    sheet(
      statements,
      emit = makeEmitter(false),
      '', '',     // prefix and compose
      1,          // local, by default
      state
    )

    return emit.x()
  }
/*/-statements-/*/
  instance.inline = function (_declarations, emit) {
    declarations(
      _declarations,
      emit = makeEmitter(true),
      '',         // prefix
      1,          //local
      state
    )
    return emit.x()
  }

  return instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})