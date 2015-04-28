define('j2c', function(){return (function () {
  var
    type = ({}).toString,
    OBJECT = type.call({}),
    ARRAY =  type.call([]),
    default_scope = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  // Helper to compensate the fact that you can't have arbitrary expressions as
  // object literal keys.
  // Golfed implementation for maximal byte shaving :-)
  function _O(k, v, o) {
    (o = {})[k] = v;
    return o;
  }

  // Handles the property:value; pairs.
  function _declarations(o, buf, pfx, vendors, /*var*/ k, v, kk) {
    switch (type.call(o)) {
    case ARRAY:
      for (k in o) {
        _declarations(o[k], buf, pfx, vendors);
      };
      break;
    case OBJECT:
      pfx = (pfx && pfx + "-")
      for (k in o) {
        v = o[k];
        if (k.indexOf("$") + 1)
          for (kk in k = k.split("$"))
            _declarations(v, buf, pfx + k[kk], vendors);
        else _declarations(v, buf, pfx + k, vendors);
      }
      break;
    default:
      // pfx is falsy when it is "", which means that we're
      // at the top level.
      // `o` is then treated as a `property:value` pair.
      // otherwise, `pfx` is the property name, and
      // `o` is the value.
      o = (pfx && (pfx).replace(/_/g, "-") + ":") + o + ";";
      // vendorify
      for (k in vendors) {
        buf.push("-" + vendors[k] + "-" + o);
      }
      buf.push(o)
    }
  }

  function j2c(o, buf) {
    _declarations(o, buf = [], "", j2c.vendors);
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
*/});