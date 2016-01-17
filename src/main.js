import {own, emptyArray, type, ARRAY, FUNCTION} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'

function flatIter (f) {
  return function iter(arg) {
    if (type.call(arg) === ARRAY) for (var i= 0 ; i < arg.length; i ++) iter(arg[i])
    else f(arg)
  }
}

export default function j2c() {
  var postprocessors = []
  var locals = {}
  var sheets = []
  var index = {}

  var instance = {
    flatIter: flatIter,
    names: locals,
    scopeRoot: '__j2c-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    sheets: sheets,
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return instance
    }
  }

  var registerLocals= flatIter(function(ns) {
    for (var k in ns) if (!( k in locals )) locals[k] = ns[k]
  })

  var registerPostprocessor = flatIter(function(pp) {
    postprocessors.push(pp)
  })

  var _use = flatIter(function(plugin) {
    if (type.call(plugin) === FUNCTION) plugin = plugin(instance)
    if (!plugin) return
    for (var k in plugin) if (own.call(plugin, k)) switch(k) {
    case 'namespace': registerLocals(plugin[k]); break
    case 'postprocess': registerPostprocessor(plugin[k]); break
    default: if (!( k in instance )) instance[k] = plugin[k]
    }
  })

  _use(emptyArray.slice.call(arguments))

  function postprocess(buf, res, i) {
    for (i = 0; i< postprocessors.length; i++) buf = postprocessors[i](buf) || buf
    return buf.join('')
  }

  instance.remove = function (sheet) {
    if (!( sheet in index )) return
    index[sheet]--
    if (!index[sheet]) {
      sheets.splice(sheets.indexOf(sheet), 0)
      delete index[sheet]
      return true
    }
  }
  var state = {
    e: function extend(parent, child) {
      var nameList = locals[child]
      locals[child] =
        nameList.slice(0, nameList.lastIndexOf(' ') + 1) +
        parent + ' ' +
        nameList.slice(nameList.lastIndexOf(' ') + 1)
    },
    l: function localize(match, space, global, dot, name) {
      if (global) return space + global
      if (!locals[name]) locals[name] = name + instance.scopeRoot
      return space + dot + locals[name].match(/\S+$/)
    }
  }

/*/-statements-/*/
  instance.sheet = function(statements, buf) {
    sheet(
      statements, buf = [],
      '', '',     // prefix and rawPRefix
      emptyArray, // vendors
      1,          // local, by default
      state
    )
    buf = postprocess(buf)
    if (buf in index) {
      index[buf]++
    } else {
      index[buf] = 1
      sheets.push(buf)
    }
    return buf
  }
/*/-statements-/*/
  instance.inline = function (decl, buf) {
    declarations(
      decl,
      buf = [],
      '',         // prefix
      emptyArray, // vendors
      1,          //local
      state
    )
    return postprocess(buf)
  }

  return instance
}