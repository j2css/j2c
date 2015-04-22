/*/-notice-/*//*
This source file is incomplete and useless in itself.
See the 'dist' directory for usable files.
*//*/-notice-/*/(function () {
  var
    OBJECT = "[object Object]",
    STRING = "[object String]",
    ARRAY =  "[object Array]",
    type = ({}).toString,
    default_root = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  function _O(k, v, o) {
    o = {};
    o[k] = v;
    return o;
  }

  function inline(o) {
    var buf = [];
    _declarations(o, buf, "", j2c.vendors, "");
    return buf.join("");
  }

  function _declarations(o, buf, pfx, vendors/*var*/, k, v) {
    switch (type.call(o)) {
    case ARRAY:
      o.forEach(function (o) {
        _declarations(o, buf, pfx, vendors);
      });
      break;
    case OBJECT:
      for (k in o) {
        v = o[k];
        k.split("/").forEach(function(k){
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

  /*/-inline-/*/
  return {
    inline: inline,
    vendors:["o", "ms", "moz", "webkit"]
  }
  /*/-inline-/*/

  /*/-statements-/*/
  function j2c(root) {return new Sheet(root);}
  function Sheet(root) {
    this.root = (root != null ? root : default_root + (counter++));
    this.buf = []
  }
  
  Sheet.prototype = Sheet;

  Sheet.add = function (statements) {
    _add(statements, this.buf, this.root.split(","), j2c.vendors);
    return this
  };

  function cartesian(a,b) {
    var res = [];
    for (var i, j = 0; j < b.length; j++)
      for (i = 0; i< a.length; i++) 
        res.push(a[i]+b[j]);
    return res;
  }

  function _add(statements, buf, pfx, vendors/*var*/, k, v, props) {
    switch (type.call(statements)) {
    case OBJECT:
      props = {};
      for (k in statements) {
        v = statements[k];
        if (k[0] == "@"){
          if (type.call(v) == OBJECT) {
            buf.push(k + "{");
            _add(v, buf, pfx, vendors);
            buf.push("}");
          } else {
            buf.push(k + " " + v + ";");
          }
        } else if (k.match(/^[-\w\/]+$/)) {
          props[k] = v;
        } else {
          _add(v, buf, cartesian(pfx, k.split(",")), vendors);
        }
      }
      // fake loop to detect the presence of keys in props.
      for (k in props){
        buf.push(pfx + "{");
        _declarations(props, buf, "", vendors);
        buf.push("}");
        break;
      }
      break;
    case ARRAY:
      statements.forEach(function (statement) {
        _add(statement, buf, pfx, vendors);
      })
      break;
    case STRING:
        buf.push(pfx.join(",") + "{" + statements + "}");
    }
  }

  Sheet.keyframes = function(name, frames) {
    j2c.vendors.forEach(function(vendor) {
      _add(_O("@-" + vendor + "-keyframes " + name, frames), this.buf, [""], [vendor]);
    }, this)    
    _add(_O("@keyframes " + name, frames), this.buf, [""], j2c.vendors);
    return this;
  }

  Sheet.font = function(o) {
    this.buf.push("@font-face{");
    _declarations(o, this.buf, "", []);
    this.buf.push("}");
    return this
  }

  Sheet.toString = function () {
    return this.buf.join("");
  };

  j2c.inline = inline;
  j2c.vendors = ["o", "ms", "moz", "webkit"];
  return j2c;
  /*/-statements-/*/
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