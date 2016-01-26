define(function () { 'use strict';

  var emptyObject = {};
  var emptyArray = [];
  var type = emptyObject.toString;
  var own =  emptyObject.hasOwnProperty;
  var OBJECT = type.call(emptyObject);
  var ARRAY =  type.call(emptyArray);
  var STRING = type.call('');
  var FUNCTION = type.call(type);
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
        buf.d('-', vendors[kk], '-', k, k ? ':': '', o, ';\n')
  /*/-statements-/*/

      buf.d(k, k ? ':': '', o, ';\n')

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
          buf.a(k, ' ', v[kk], ';\n')
        }
      } else {
        buf.a(k, ' ', v, ';\n')
      }
    } else if (/^@keyframes /.test(k)) {
      k = local ? k.replace(
        // generated by script/regexps.js
        /( )(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/,
        ns.l
      ) : k
      // add a @-webkit-keyframes block too.

      buf.a('@-webkit-', k.slice(1), ' {\n')
      sheet(v, buf, '', '', ['webkit'])
      buf.c('}\n')

      buf.a(k, ' {\n')
      sheet(v, buf, '', '', vendors, local, ns)
      buf.c('}\n')

    } else if (/^@extends?$/.test(k)) {

      /*eslint-disable no-cond-assign*/
      // pick the last class to be extended
      while (kk = findClass.exec(rawPrefix)) k = kk[4]
      /*eslint-enable no-cond-assign*/
      if (k == null || !local) {
        // we're in a @global{} block
        buf.a('@-error-cannot-extend-in-global-context ', JSON.stringify(rawPrefix), ';\n')
        return
      } else if (/^@extends?$/.test(k)) {
        // no class in the selector
        buf.a('@-error-no-class-to-extend-in ', JSON.stringify(rawPrefix), ';\n')
        return
      }
      ns.e(
        type.call(v) == ARRAY ? v.map(function (parent) {
          return parent.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l)
        }).join(' ') : v.replace(/()(?::global\(\s*(\.[-\w]+)\s*\)|()\.([-\w]+))/, ns.l),
        k
      )

    } else if (/^@(?:font-face$|viewport$|page )/.test(k)) {
      if (type.call(v) === ARRAY) {
        for (kk = 0; kk < v.length; kk++) {
          buf.a(k, ' {\n')
          declarations(v[kk], buf, '', vendors, local, ns)
          buf.c('}\n')
        }
      } else {
        buf.a(k, ' {\n')
        declarations(v, buf, '', vendors, local, ns)
        buf.c('}\n')
      }

    } else if (/^@global$/.test(k)) {
      sheet(v, buf, prefix, rawPrefix, vendors, 0, ns)

    } else if (/^@local$/.test(k)) {
      sheet(v, buf, prefix, rawPrefix, vendors, 1, ns)

    } else if (/^@(?:media |supports |document )./.test(k)) {
      buf.a(k, ' {\n')
      sheet(v, buf, prefix, rawPrefix, vendors, local, ns)
      buf.c('}\n')

    } else {
      buf.a('@-error-unsupported-at-rule ', JSON.stringify(k), ';\n')
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
            buf.s(( prefix || '*' ), ' {\n')
          }
          declarations(v, buf, k, vendors, local, ns)
        } else if (/^@/.test(k)) {
          // Handle At-rules
          inDeclaration = (inDeclaration && buf.c('}\n') && 0)

          at(k, v, buf, prefix, rawPrefix, vendors, local, ns)

        } else {
          // selector or nested sub-selectors

          inDeclaration = (inDeclaration && buf.c('}\n') && 0)

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
      if (inDeclaration) buf.c('}\n')
      break
    case STRING:
      buf.s(
          ( prefix || ':-error-no-selector' ) , ' {\n'
        )
      declarations(statements, buf, '', vendors, local, ns)
      buf.c('}\n')
    }
  }

  function flatIter (f) {
    return function iter(arg) {
      if (type.call(arg) === ARRAY) for (var i= 0 ; i < arg.length; i ++) iter(arg[i])
      else f(arg)
    }
  }

  function j2c() {
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


    function makeBuf() {
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
      // for (var i = 0; i < filters.length; i++) buf = filters[i](buf)
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

  return j2c;

});