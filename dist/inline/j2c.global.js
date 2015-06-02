;var j2c = (function () {
  var
    empty = [],
    type = ({}).toString,
    own =  ({}).hasOwnProperty,
    OBJECT = type.call({}),
    ARRAY =  type.call(empty),
    STRING = type.call(""),
    propertyName = /^[-\w$]+$/,
    scope_root = "_j2c_" + (Math.random() * 1e9 | 0) + "_" + 1 * (new Date()) + "_",
    counter = 0,
    j2c = {};

  // Handles the property:value; pairs.
  // Note that the sheets are built upside down and reversed before being
  // turned into strings.
  function _declarations(o, buf, prefix, vendors, localize,/*var*/ k, v, kk) {
    switch (type.call(o)) {
    case ARRAY:
      for (k = o.length;k--;)
        _declarations(o[k], buf, prefix, vendors, localize);
      break;
    case OBJECT:
      prefix = (prefix && prefix + "-");
      for (k in o) {
        v = o[k];
        if (k.indexOf("$") + 1) {
          // "$" was found.
          for (kk in k = k.split("$").reverse()) if (own.call(k, kk))
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
      k=(prefix && (prefix).replace(/_/g, "-") + ":")

      if (localize && (k == "animation-name:" || k == "animation:")) {
        o = o.split(',').map(function(o){
          return o.replace(/([-\w]+)/, localize)}
        ).join(",");
      }

      buf.push(o = k + o + ";");
      // vendorify
      for (k = vendors.length; k--;)
         buf.push("-" + vendors[k] + "-" + o);
    }
  }


  /*/-inline-/*/
  j2c.inline = function (o, vendors, buf) {
    _declarations(o, buf = [], "", vendors || empty);
    return buf.reverse().join("\n");
  }

  function _cartesian(a,b, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(a[i] + b[j]);
    return res;
  }
  /*/-inline-/*/

  

  j2c.prefix = function(val, vendors) {
    return _cartesian(
      vendors.map(function(p){return "-"+p+"-"}).concat([""]),
      [val]
    );
  };
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