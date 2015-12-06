/*/-notice-/*//*
This source file needs to be preprocessed to become meaningful.

It is augmented for the various module systems by the build script.

The -inline- and -statements- sections are mutually exclusive, and are only
included in the inline and main builds, respectively.

See the 'dist' directory for usable files.

A move to rollup as a build system is planned, post v0.8.0

*//*/-notice-/*/(function () {
  /*jslint bitwise: true,  unused:true, eqnull:true*/
  var
    emptyObject = {},
    emptyArray = [],
    type = emptyObject.toString,
    own =  emptyObject.hasOwnProperty,
    twoPow32 = Math.pow(2,32),
    OBJECT = type.call(emptyObject),
    ARRAY =  type.call(emptyArray),
    STRING = type.call(""),
    scope_root = "_j2c_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_",
    counter = 0;

  function _decamelize(match) {
    return "-" + match.toLowerCase();
  }

  // Handles the property:value; pairs.
  function _declarations(o, buf, prefix, vendors, localize,/*var*/ k, v, kk) {
    if (o==null) return;
    switch ( type.call(o = o.valueOf()) ) {
    case ARRAY:
      for (k = 0; k < o.length; k++)
        _declarations(o[k], buf, prefix, vendors, localize);
      break;
    case OBJECT:
      prefix = (prefix && prefix + "-");
      for (k in o) if (own.call(o, k)){
        v = o[k];
        if (k.indexOf("$") + 1) {
          // "$" was found.
          for (kk in (k = k.split("$"))) if (own.call(k, kk))
            _declarations(v, buf, prefix + k[kk], vendors, localize);
        } else {
          _declarations(v, buf, prefix + k, vendors, localize);
        }
      }
      break;
    default:
      // prefix is falsy when it is "", which means that we're
      // at the top level.
      // `o` is then treated as a `property:value` pair.
      // otherwise, `prefix` is the property name, and
      // `o` is the value.
      k = (prefix && (prefix).replace(/_/g, "-").replace(/[A-Z]/g, _decamelize) + ":");

      if (localize && (k == "animation-name:" || k == "animation:")) {
        o = o.split(',').map(function(o){
          return o.replace(/()(?:(?::global\(([-\w]+)\))|(?:()([-\w]+)))/, localize);
        }).join(",");
      }

      o = k + o + ";";

  /*/-statements-/*/
      // vendorify
      for (kk = 0; kk < vendors.length; kk++)
         buf.push("-" + vendors[kk] + "-" + o);
  /*/-statements-/*/

      buf.push(o);
    }
  }

  /*/-inline-/*/
  function _cartesian(a, b, res, i, j) {
    res = [];
    for (j in b) if (own.call(b, j))
      for (i in a) if (own.call(a, i))
        res.push(a[i] + b[j]);
    return res;
  }
  /*/-inline-/*/

  /*/-statements-/*/
  function _cartesian(a,b, selectorP, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(_concat(a[i], b[j], selectorP));
    return res;
  }

  function _concat(a, b, selectorP) {
    if (selectorP && b.match(/^[-\w$]+$/)) throw new Error("invalid selector '" + b +  "'");
    return selectorP && b.indexOf("&") + 1 ? b.replace(/&/g, a) : a + b;
  }
  /*/-statements-/*/

  /*/-statements-/*/
  // Add rulesets and other CSS statements to the sheet.
  function _sheet(statements, buf, prefix, vendors, localize, /*var*/ k, kk, v, decl, at) {
    // optionally needed in the "[object String]" case
    // where the `statements` variable actually holds
    // declaratons. This allows to process either a
    // string or a declarations object with the same code.

    // Golf trick: since we only search using /^anchored/ regexes,
    // `k.search(/^regex/)` will either return `0` on success and
    // `-1` otherwise. Thus `!k.search(/^regex/)` will be true
    // on success and false otherwise.

    decl = statements;

    switch (type.call(statements)) {

    case ARRAY:
      for (k = 0; k < statements.length; k++)
        _sheet(statements[k], buf, prefix, vendors, localize);
      break;

    case OBJECT:
      decl = {};
      for (k in statements) {
        v = statements[k];
        if (!k.search(/^[-\w$]+$/)) {
          // It is a declaration.
          decl[k] = v;
        } else if (k[0] == "@") {
          // Handle At-rules
          if (!k.search(/^.(?:namespace|import|charset)/)) {
            if(type.call(v) == ARRAY){
              for (kk = 0; kk < v.length; kk ++) {
                buf.push(k + " " + v[kk] + ";");
              }
            } else {
              buf.push(k + " " + v + ";");
            }
          } else if (!k.search(/^.keyframes /)) {
            k = localize ? k.replace(/( )(?:(?::global\(([-\w]+)\))|(?:()([-\w]+)))/, localize) : k;
            // add a @-webkit-keyframes block too.

            buf.push("@-webkit-" + k.slice(1) + "{");
            _sheet(v, buf, "", ["webkit"]);
            buf.push("}");

            buf.push(k + "{");
            _sheet(v, buf, "", vendors, localize);
            buf.push("}");


          } else if (!k.search(/^.(?:font-face|viewport|page )/)) {
            _sheet(v, buf, k, emptyArray);

          } else if (!k.search(/^.global/)) {
            _sheet(v, buf, (localize ? prefix.replace(/()(?:(?::global\((\.[-\w]+)\))|(?:(\.)([-\w]+)))/g, localize) : prefix), vendors);

          } else {
            // conditional block (@media @document or @supports)
            at = true;
          }
        } else {
          // nested sub-selectors
          _sheet(v, buf,
            /* if prefix and/or k have a coma */
            prefix.indexOf(",") + k.indexOf(",") + 2 ?
            /* then */
              _cartesian(prefix.split(","), k.split(","), 1).join(",") :
            /* else */
              _concat(prefix, k, 1),
            vendors,
            localize
          );
        }
      }
      // fall through for handling declarations. The next line is for JSHint.
      /* falls through */
    case STRING:
      // compute the selector.
      v = (localize ? prefix.replace(/()(?:(?::global\((\.[-\w]+)\))|(?:(\.)([-\w]+)))/g, localize) : prefix) || "*";
      // fake loop to detect the presence of declarations.
      // runs if decl is a non-empty string or when falling
      // through from the `Object` case, when there are
      // declarations.
      // We could use `Object.keys(decl).length`, but it would
      // allocate an array for nothing. It also requires polyfills
      // for ES3 browsers.
      for (k in decl) if (own.call(decl, k)){
        buf.push(v + "{");
        _declarations(decl, buf, "", vendors, localize);
        buf.push("}");
        break;
      }
    }

    // Add conditional, nestable at-rules at the end.
    // The current architecture prevents from putting them
    // in place, and putting them before may end up in accidentally shadowing
    // rules of the conditional block with unconditional ones.
    if (at) for (k in statements) if (!k.search(/^@(?:media|document|supports)/)) {
      buf.push(k + "{");
      _sheet(statements[k], buf, prefix, vendors, localize);
      buf.push("}");
    }
  }
  /*/-statements-/*/

  function _finalize(buf, plugins, i) {
    plugins = plugins || emptyArray;
    for (i = 0; i< plugins.length; i++) buf = plugins[i](buf) || buf;
    return buf.join("\n");
  }



  function j2c(res) {
    res = res || {};
    var extensions = [];
    res.use = function() {
      var args = arguments;
      for (var i = 0; i < args.length; i++){
        extensions.push(args[i]);
      }
      return res;
    };
/*/-statements-/*/
    res.sheet = function(ns, statements) {
      if (arguments.length === 1) {
        statements = ns; ns = {};
      }
      var
        suffix = scope_root + counter++,
        locals = {},
        k, buf = [];

        for (k in ns) if (k-0 != k-0 && own.call(ns, k)) {
          locals[k] = ns[k];
        }
      _sheet(
        statements, buf, "", emptyArray /*vendors*/,
        function localize(match, space, global, dot, name) {
          if (global) return space+global;
          if (!locals[name]) locals[name] = name + suffix;
          return space + dot + locals[name];
        }
      );
      /*jshint -W053 */
      buf = new String(_finalize(buf, extensions));
      /*jshint +W053 */
      for (k in locals) if (own.call(locals, k)) buf[k] = locals[k];
      return buf;
    };
/*/-statements-/*/
    res.inline = function (locals, decl, buf) {
      if (arguments.length === 1) {
        decl = locals; locals = {};
      }
      _declarations(
        decl,
        buf = [],
        "", // prefix
        emptyArray, // vendors
        function localize(match, space, global, dot, name) {
          if (global) return space+global;
          if (!locals[name]) return name;
          return space + dot + locals[name];
        });
      return _finalize(buf, extensions);
    };

    res.prefix = function(val, vendors) {
      return _cartesian(
        vendors.map(function(p){return "-" + p + "-";}).concat([""]),
        [val]
      );
    };
    return res;
  }
  j2c(j2c);
  delete j2c.use;
  return j2c;
})()

/*
Copyright © 2015 Pierre-Yves Gérardy

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the “Software”),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/