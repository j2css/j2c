import {own, flatIter, emptyArray, type, FUNCTION} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'

export default function j2c() {
  var filters = []
  var postprocessors = []
  var instance = {
    flatIter: flatIter,
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
    }),
    $postprocess: flatIter(function(pp) {
      postprocessors.push(pp)
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

  function postprocess(buf, res, i) {
    for (i = 0; i< postprocessors.length; i++) buf = postprocessors[i](buf) || buf
    return buf.join('')
  }

  var state = {
    c: function composes(parent, child) {
      var nameList = instance.names[child]
      instance.names[child] =
        nameList.slice(0, nameList.lastIndexOf(' ') + 1) +
        parent + ' ' +
        nameList.slice(nameList.lastIndexOf(' ') + 1)
    },
    l: function localize(match, global, dot, name) {
      if (global) return global
      if (!instance.names[name]) instance.names[name] = name + instance.suffix
      return dot + instance.names[name].match(/\S+$/)
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
    buf = postprocess(buf.b)
    return buf
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
    return postprocess(buf.b)
  }

  return instance
}

var _j2c = j2c()
'sheet|sheets|inline|remove|names|flatIter'.split('|').map(function(m){j2c[m] = _j2c[m]})