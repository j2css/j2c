var j2c = (function () { 'use strict';

  var emptyObject = {};
  var emptyArray = [];
  var type = emptyObject.toString;
  var own =  emptyObject.hasOwnProperty;
  var OBJECT = type.call(emptyObject);
  var ARRAY =  type.call(emptyArray);
  var STRING = type.call('');
  /*/-inline-/*/
  // function cartesian(a, b, res, i, j) {
  //   res = [];
  //   for (j in b) if (own.call(b, j))
  //     for (i in a) if (own.call(a, i))
  //       res.push(a[i] + b[j]);
  //   return res;
  // }
  /*/-inline-/*/

  /* /-statements-/*/
  function cartesian(a,b, selectorP, res, i, j) {
    res = []
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(concat(a[i], b[j], selectorP))
    return res
  }

  function concat(a, b, selectorP) {
    // `b.replace(/&/g, a)` is never falsy, since the
    // 'a' of cartesian can't be the empty string
    // in selector mode.
    return selectorP && (
      /^[-\w$]+$/.test(b) && ':-error-bad-sub-selector-' + b ||
      /&/.test(b) && /* never falsy */ b.replace(/&/g, a)
    ) || a + b
  }

  function decamelize(match) {
    return '-' + match.toLowerCase()
  }

  /**
   * Handles the property:value; pairs.
   *
   * @param {array|object|string} o - the declarations.
   * @param {string[]} buf - the buffer in which the final style sheet is built.
   * @param {string} prefix - the current property or a prefix in case of nested
   *                          sub-properties.
   * @param {string} vendors - a list of vendor prefixes.
   * @Param {boolean} local - are we in @local or in @global scope.
   * @param {object} ns - helper functions to populate or create the @local namespace
   *                      and to @extend classes.
   * @param {function} ns.e - @extend helper.
   * @param {function} ns.l - @local helper.
   */

  function declarations(o, buf, prefix, vendors, local, ns, /*var*/ k, v, kk) {
    if (o==null) return
    if (/\$/.test(prefix)) {
      for (kk in (prefix = prefix.split('$'))) if (own.call(prefix, kk)) {
        declarations(o, buf, prefix[kk], vendors, local, ns)
      }
      return
    }
    switch ( type.call(o = o.valueOf()) ) {
    case ARRAY:
      for (k = 0; k < o.length; k++)
        declarations(o[k], buf, prefix, vendors, local, ns)
      break
    case OBJECT:
      // prefix is falsy iif it is the empty string, which means we're at the root
      // of the declarations list.
      prefix = (prefix && prefix + '-')
      for (k in o) if (own.call(o, k)){
        v = o[k]
        if (/\$/.test(k)) {
          for (kk in (k = k.split('$'))) if (own.call(k, kk))
            declarations(v, buf, prefix + k[kk], vendors, local, ns)
        } else {
          declarations(v, buf, prefix + k, vendors, local, ns)
        }
      }
      break
    default:
      // prefix is falsy when it is "", which means that we're
      // at the top level.
      // `o` is then treated as a `property:value` pair.
      // otherwise, `prefix` is the property name, and
      // `o` is the value.
      k = prefix.replace(/_/g, '-').replace(/[A-Z]/g, decamelize)

      if (local && (k == 'animation-name' || k == 'animation')) {
        o = o.split(',').map(function (o) {
          return o.replace(/()(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/, ns.l)
        }).join(',')
      }
      if (/^animation|^transition/.test(k)) vendors = ['webkit']
      // '@' in properties also triggers the *ielte7 hack
      // Since plugins dispatch on the /^@/ for at-rules
      // we swap the at for an asterisk
      // http://browserhacks.com/#hack-6d49e92634f26ae6d6e46b3ebc10019a

      k = k.replace(/^@/, '*')

  /*/-statements-/*/
      // vendorify
      for (kk = 0; kk < vendors.length; kk++)
        buf.push('-', vendors[kk], '-', k, k ? ':': '', o, ';\n')
  /*/-statements-/*/

      buf.push(k, k ? ':': '', o, ';\n')

    }
  }

  var findClass = /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g

  /**
   * Hanldes at-rules
   *
   * @param {string} k - The at-rule name, and, if takes both parameters and a
   *                     block, the parameters.
   * @param {string[]} buf - the buffer in which the final style sheet is built
   * @param {string[]} v - Either parameters for block-less rules or their block
   *                       for the others.
   * @param {string} prefix - the current selector or a prefix in case of nested rules
   * @param {string} rawPrefix - as above, but without localization transformations
   * @param {string} vendors - a list of vendor prefixes
   * @Param {boolean} local - are we in @local or in @global scope?
   * @param {object} ns - helper functions to populate or create the @local namespace
   *                      and to @extend classes
   * @param {function} ns.e - @extend helper
   * @param {function} ns.l - @local helper
   */

  function at(k, v, buf, prefix, rawPrefix, vendors, local, ns){
    var kk
    if (/^@(?:namespace|import|charset)$/.test(k)) {
      if(type.call(v) == ARRAY){
        for (kk = 0; kk < v.length; kk++) {
          buf.push(k, ' ', v[kk], ';\n')
        }
      } else {
        buf.push(k, ' ', v, ';\n')
      }
    } else if (/^@keyframes /.test(k)) {
      k = local ? k.replace(
        // generated by script/regexps.js
        /( )(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/,
        ns.l
      ) : k
      // add a @-webkit-keyframes block too.

      buf.push('@-webkit-', k.slice(1), ' {\n')
      sheet(v, buf, '', '', ['webkit'])
      buf.push('}\n')

      buf.push(k, ' {\n')
      sheet(v, buf, '', '', vendors, local, ns)
      buf.push('}\n')

    } else if (/^@extends?$/.test(k)) {

      /*eslint-disable no-cond-assign*/
      // pick the last class to be extended
      while (kk = findClass.exec(rawPrefix)) k = kk[4]
      /*eslint-enable no-cond-assign*/
      if (k == null || !local) {
        // we're in a @global{} block
        buf.push('@-error-cannot-extend-in-global-context ', JSON.stringify(rawPrefix), ';\n')
        return
      } else if (/^@extends?$/.test(k)) {
        // no class in the selector
        buf.push('@-error-no-class-to-extend-in ', JSON.stringify(rawPrefix), ';\n')
        return
      }
      ns.e(
        type.call(v) == ARRAY ? v.map(function (parent) {
          return parent.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l)
        }).join(' ') : v.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l),
        k
      )

    } else if (/^@(?:font-face$|viewport$|page )/.test(k)) {
      sheet(v, buf, k, k, emptyArray)

    } else if (/^@global$/.test(k)) {
      sheet(v, buf, prefix, rawPrefix, vendors, 0, ns)

    } else if (/^@local$/.test(k)) {
      sheet(v, buf, prefix, rawPrefix, vendors, 1, ns)

    } else if (/^@(?:media |supports |document )./.test(k)) {
      buf.push(k, ' {\n')
      sheet(v, buf, prefix, rawPrefix, vendors, local, ns)
      buf.push('}\n')

    } else {
      buf.push('@-error-unsupported-at-rule ', JSON.stringify(k), ';\n')
    }
  }

  /**
   * Add rulesets and other CSS statements to the sheet.
   *
   * @param {array|string|object} statements - a source object or sub-object.
   * @param {string[]} buf - the buffer in which the final style sheet is built
   * @param {string} prefix - the current selector or a prefix in case of nested rules
   * @param {string} rawPrefix - as above, but without localization transformations
   * @param {string} vendors - a list of vendor prefixes
   * @Param {boolean} local - are we in @local or in @global scope?
   * @param {object} ns - helper functions to populate or create the @local namespace
   *                      and to @extend classes
   * @param {function} ns.e - @extend helper
   * @param {function} ns.l - @local helper
   */
  function sheet(statements, buf, prefix, rawPrefix, vendors, local, ns) {
    var k, kk, v, inDeclaration

    switch (type.call(statements)) {

    case ARRAY:
      for (k = 0; k < statements.length; k++)
        sheet(statements[k], buf, prefix, rawPrefix, vendors, local, ns)
      break

    case OBJECT:
      for (k in statements) {
        v = statements[k]
        if (prefix && /^[-\w$]+$/.test(k)) {
          if (!inDeclaration) {
            inDeclaration = 1
            buf.push(( prefix || '*' ), ' {\n')
          }
          declarations(v, buf, k, vendors, local, ns)
        } else if (/^@/.test(k)) {
          // Handle At-rules
          inDeclaration = (inDeclaration && buf.push('}\n') && 0)

          at(k, v, buf, prefix, rawPrefix, vendors, local, ns)

        } else {
          // selector or nested sub-selectors

          inDeclaration = (inDeclaration && buf.push('}\n') && 0)

          sheet(v, buf,
            (kk = /,/.test(prefix) || prefix && /,/.test(k)) ?
              cartesian(prefix.split(','), ( local ?
            k.replace(
              /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
            ) : k
          ).split(','), prefix).join(',') :
              concat(prefix, ( local ?
            k.replace(
              /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
            ) : k
          ), prefix),
            kk ?
              cartesian(rawPrefix.split(','), k.split(','), rawPrefix).join(',') :
              concat(rawPrefix, k, rawPrefix),
            vendors,
            local, ns
          )
        }
      }
      if (inDeclaration) buf.push('}\n')
      break
    case STRING:
      buf.push(
          ( prefix || ':-error-no-selector' ) , ' {\n'
        )
      declarations(statements, buf, '', vendors, local, ns)
      buf.push('}\n')
    }
  }

  var scope_root = '_j2c_' +
        Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
        Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
        Math.floor(Math.random() * 0x100000000).toString(36) + '_' +
        Math.floor(Math.random() * 0x100000000).toString(36) + '_';
  var counter = 0;
  function j2c(res) {
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

  return j2c;

})();