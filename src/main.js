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
    return buf.join('')
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
    // pick only non-numeric keys since `(NaN != NaN) === true`
    for (k in ns) if (k-0 != k-0 && own.call(ns, k)) {
      locals[k] = ns[k]
    }
    sheet(
      statements, buf, '', '', emptyArray /*vendors*/,
      1, // local
      {
        e: function extend(parent, child) {
          var nameList = locals[child]
          locals[child] =
            nameList.slice(0, nameList.lastIndexOf(' ') + 1) +
            parent + ' ' +
            nameList.slice(nameList.lastIndexOf(' ') + 1)
        },
        l: function localize(match, space, global, dot, name) {
          if (global) {
            return space + global
          }
          if (!locals[name]) locals[name] = name + suffix
          return space + dot + locals[name].match(/\S+$/)
        }
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
      1,
      {
        l: function localize(match, space, global, dot, name) {
          if (global) return space + global
          if (!locals[name]) return name
          return space + dot + locals[name]
        }
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

j2c.global = function(x) {
  return ':global(' + x + ')'
}

j2c.kv = kv
function kv (k, v, o) {
  o = {}
  o[k] = v
  return o
}

j2c.at = function at (rule, params, block) {
  if (
    arguments.length < 3
  ) {
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule + ' ' + params, block)
}

j2c(j2c)
delete j2c.use
