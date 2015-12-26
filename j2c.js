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
    twoPow32 = Math.pow(2,32),
    scope_root = "_j2c_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_" +
      Math.floor(Math.random() * twoPow32).toString(36) + "_",
    counter = 0;









  function j2c(res) {
    res = res || {};
    var extensions = [];

    function _finalize(buf, i) {
      for (i = 0; i< extensions.length; i++) buf = extensions[i](buf) || buf;
      return buf.join("\n");
    }

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
      buf = new String(_finalize(buf));
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
      return _finalize(buf);
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
  export {j2c};
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