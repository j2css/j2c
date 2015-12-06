export default (function () {
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

      // vendorify
      for (kk = 0; kk < vendors.length; kk++)
         buf.push("-" + vendors[kk] + "-" + o);

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
*/;