export default (function () {
  var
    type = ({}).toString,
    own = ({}).hasOwnProperty,
    OBJECT = type.call({}),
    ARRAY =  type.call([]),
    STRING =  type.call(""),
    default_scope = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  function _cartesian(a,b, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(a[i]+b[j]);
    return res;
  }

  // Handles the property:value; pairs.
  function _declarations(o, buf, pfx, vendors, /*var*/ k, v, kk) {
    switch (type.call(o)) {
    case ARRAY:
      for (k in o) if (own.call(o, k))
        _declarations(o[k], buf, pfx, vendors);
      break;
    case OBJECT:
      pfx = (pfx && pfx + "-");
      for (k in o) {
        v = o[k];
        if (k.indexOf("$") + 1) {
          // "$" was found.
          for (kk in k = k.split("$")) if (own.call(k, kk))
            _declarations(v, buf, pfx + k[kk], vendors);
        } else {
          _declarations(v, buf, pfx + k, vendors);
        }
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
      for (k in vendors) if(own.call(vendors, k))
         buf.push("-" + vendors[k] + "-" + o);
      buf.push(o);
    }
  }

  function j2c(o, buf) {
    _declarations(o, buf = [], "", j2c.vendors);
    return buf.join("");
  }


  
  j2c.prefix = function(pfx, val) {
    return _cartesian(
      pfx.map(function(p){return "-"+p+"-"}).concat([""]),
      [val]
    );
  };
  j2c.vendors = [];
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