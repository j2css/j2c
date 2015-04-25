export default (function () {
  var
    OBJECT = "[object Object]",
    STRING = "[object String]",
    ARRAY =  "[object Array]",
    type = ({}).toString,
    default_scope = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  // Helper to compensate the fact that you can't have arbitrary expressions as
  // object literal keys.
  function _O(k, v, o) {
    o = {};
    o[k] = v;
    return o;
  }

  // Handles the property:value; pairs.
  function _declarations(o, buf, pfx, vendors, /*var*/ k, v) {
    switch (type.call(o)) {
    case ARRAY:
      o.forEach(function (o) {
        _declarations(o, buf, pfx, vendors);
      });
      break;
    case OBJECT:
      for (k in o) {
        v = o[k];
        k.split("$").forEach(function(k){
          _declarations(v, buf, (pfx && pfx + "-") + k, vendors);
        });
      }
      break;
    default:
      o = (pfx && (pfx).replace(/_/g, "-") + ":") + o + ";";
      vendors.forEach(function (v) {
        buf.push("-" + v + "-" + o);
      })
      buf.push(o)
    }
  }

  function j2c(o) {
    var buf = [];
    _declarations(o, buf, "", j2c.vendors);
    return buf.join("");
  }


  
  j2c.vendors = ["o", "ms", "moz", "webkit"];
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