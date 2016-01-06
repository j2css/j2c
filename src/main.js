import {own, cartesian, emptyArray} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'

var scope_root = '_j2c_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '_',
  counter = 0

export default function j2c(res) {
  res = res || {}
  var extensions = []

  function finalize(buf, i) {
    for (i = 0; i< extensions.length; i++) buf = extensions[i](buf) || buf
    return buf.join('\n')
  }

  res.use = function() {
    var args = arguments
    for (var i = 0; i < args.length; i++){
      extensions.push(args[i])
    }
    return res
  }
/*/-statements-/*/
  res.sheet = function(ns, statements) {
    if (arguments.length === 1) {
      statements = ns; ns = {}
    }
    var
      suffix = scope_root + counter++,
      locals = {},
      k, buf = []

    for (k in ns) if (k-0 != k-0 && own.call(ns, k)) {
      locals[k] = ns[k]
    }
    sheet(
      statements, buf, '', emptyArray /*vendors*/,
      function localize(match, space, global, dot, name, extend) {
        var list = []
        if(extend === ':extend(') {
          if (name in ns) throw new Error("Foreign names can't be extended: " + name)
          if ((locals[name] || '').indexOf(' ') + 1) throw new Error('class .'+name+' can only be extended once')
          extend = arguments
          for (k = 6; k < extend.length - 2; k+=3) {
            if (extend[k] || extend[k+2]){
              list.push(extend[k] || localize(0, '', 0, '', extend[k+2]))
            }
          }
          list.push(name + suffix)
        } else {
          list = [name + suffix]
        }
        if (global) return space+global
        if (!locals[name]) locals[name] = list.join(' ')
        return space + dot + locals[name].match(/\S+$/)
      }
    )
    /*jshint -W053 */
    buf = new String(finalize(buf))
    /*jshint +W053 */
    for (k in locals) if (own.call(locals, k)) buf[k] = locals[k]
    return buf
  }
/*/-statements-/*/
  res.inline = function (locals, decl, buf) {
    if (arguments.length === 1) {
      decl = locals; locals = {}
    }
    declarations(
      decl,
      buf = [],
      '', // prefix
      emptyArray, // vendors
      function localize(match, space, global, dot, name) {
        if (global) return space+global
        if (!locals[name]) return name
        return space + dot + locals[name]
      })
    return finalize(buf)
  }

  res.prefix = function(val, vendors) {
    return cartesian(
      vendors.map(function(p){return '-' + p + '-'}).concat(['']),
      [val]
    )
  }
  return res
}
j2c(j2c)
delete j2c.use
