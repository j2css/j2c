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
  var filters = []
  var postprocessors = []
  var locals = {}

  var instance = {
    flatIter: flatIter,
    names: locals,
    scopeRoot: '__j2c-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return instance
    }
  }

  var registerLocals= flatIter(function(ns) {
    for (var k in ns) if (!( k in locals )) locals[k] = ns[k]
  })

  var registerFilter = flatIter(function(filter) {
    filters.push(filter)
  })

  var registerPostprocessor = flatIter(function(pp) {
    postprocessors.push(pp)
  })

  var _use = flatIter(function(plugin) {
    if (type.call(plugin) === FUNCTION) plugin = plugin(instance)
    if (!plugin) return
    for (var k in plugin) if (own.call(plugin, k)) switch(k) {
    case 'names': registerLocals(plugin[k]); break
    case 'postprocess': registerPostprocessor(plugin[k]); break
    case 'filter': registerFilter(plugin[k]); break
    default: if (!( k in instance )) instance[k] = plugin[k]
    }
  })

  _use(emptyArray.slice.call(arguments))


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
      statements, buf = makeBuf(),
      '', '',     // prefix and rawPRefix
      emptyArray, // vendors
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
      buf = makeBuf(),
      '',         // prefix
      emptyArray, // vendors
      1,          //local
      state
    )
    return postprocess(buf.b)
  }

  return instance
}

var _j2c = j2c()
'sheet|sheets|inline|remove|names|flatIter'.split('|').map(function(m){j2c[m] = _j2c[m]})