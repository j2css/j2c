import {own, flatIter, emptyArray, type, FUNCTION} from './helpers'
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
    }
  }

  var register = {
    $names: flatIter(function(ns) {
      for (var k in ns) if (!( k in instance.names )) instance.names[k] = ns[k]
    }),
    $filter: flatIter(function(filter) {
      filters.push(filter)
    })
  }

  var _use = flatIter(function(plugin) {
    if (type.call(plugin) === FUNCTION) plugin = plugin(instance)
    if (!plugin) return
    for (var k in plugin) if (own.call(plugin, k)) if (/^\$/.test(k)){
      if (k in register) register[k](plugin[k])
    } else if (!( k in instance )) instance[k] = plugin[k]

  })

  function makeBuf(inline) {
    var buf
    function push() {
      emptyArray.push.apply(buf.b, arguments)
    }
    buf = {
      b: [],   // buf
      a: push, // at-rules
      s: push, // selector
      d: push, // declaration
      c: push  // close
    }
    for (var i = 0; i < filters.length; i++) buf = filters[i](buf, inline)
    return buf
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
  instance.sheet = function(statements, buf) {
    sheet(
      statements, buf = makeBuf(false),
      '', '',     // prefix and rawPRefix
      1,          // local, by default
      state
    )

    return buf.b.join('')
  }
/*/-statements-/*/
  instance.inline = function (decl, buf) {
    declarations(
      decl,
      buf = makeBuf(true),
      '',         // prefix
      1,          //local
      state
    )
    return buf.b.join('')
  }

  return instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})