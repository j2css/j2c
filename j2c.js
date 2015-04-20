/*/-notice-/*//*
This source file is incomplete and useless in itself.
See the 'dist' directory for usable files.
*//*/-notice-/*/(function () {
  var
    OBJECT = "[object Object]",
    STRING = "[object String]",
    ARRAY =  "[object Array]",
    type = inline.call.bind(({}).toString),
    default_root = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  function _vendorify(prop, buf, vendors, indent) {
    vendors.forEach(function (v) {
      buf.push(
        /*/-INDENT-/*/indent + /*/-INDENT-/*/
        "-" + v + "-" + prop
      );
    })
    buf.push(
      /*/-INDENT-/*/indent + /*/-INDENT-/*/
      prop
    )
  }

  function _O(k, v, o) {
    o = {}
    o[k] = v
    return o
  }

  function inline(o) {
    var buf = [];
    _declarations(o, buf, "", m.vendors, "");
    return buf.join("" /*/-INDENT-/*/ || "\n" /*/-INDENT-/*/);
  }

  function _declarations(o, buf, pfx, vendors/*/-INDENT-/*/, indent /*/-INDENT-/*//*var*/, k, t, v) {
    for (k in o) {
      v = o[k];
      t = type(v);
      switch (t) {
      case ARRAY:
        v.forEach(function (vv) {
          _declarations(_O(k,vv), buf, pfx, vendors/*/-INDENT-/*/, indent/*/-INDENT-/*/);
        });
        break;
      case OBJECT:
        _declarations(v, buf, pfx + k + "-", vendors/*/-INDENT-/*/, indent/*/-INDENT-/*/);
        break;
      default:
        _vendorify(
          (pfx + k).replace(/_/g, "-") + ":" + v + ";",
          buf, vendors/*/-INDENT-/*/, indent/*/-INDENT-/*/
        );
      }
    }
  }

  /*/-statements-/*/
  function sheet(root) {return new Sheet(root);}
  function Sheet(root) {
    this.root = (root != null ? root : default_root + (counter++));
    this.buf = []
  }
  
  var Sp = Sheet.prototype;

  Sp.add = function (statements) {
    _add(statements, this.buf, this.root.split(","), m.vendors/*/-INDENT-/*/, ""/*/-INDENT-/*/);
    return this
  };

  function cartesian(a,b) {
    var res = [];
    for (var i, j = 0; j < b.length; j++)
      for (i = 0; i< a.length; i++) 
        res.push(a[i]+b[j]);
    return res;
  }

  function _add(statements, buf, pfx, vendors/*/-INDENT-/*/, indent /*/-INDENT-/*//*var*/, k, v, t, props) {
    switch (type(statements)) {
    case OBJECT:
      props = {};
      for (k in statements) {
        v = statements[k];
        t = type(v);
        if (k[0] == "@"){
          if (t == OBJECT) {
            buf.push(
              /*/-INDENT-/*/indent + /*/-INDENT-/*/
              k + "{"
            );
            _add(v, buf, pfx, vendors/*/-INDENT-/*/, indent + "  "/*/-INDENT-/*/);
            buf.push(
              /*/-INDENT-/*/indent + /*/-INDENT-/*/
              "}"
            );
          } else {
            buf.push(k + " " + v + ";");
          }
        } else if (k.match(/^[-\w]+$/)) {
          props[k] = v;
        } else {
          _add(v, buf, cartesian(pfx, k.split(",")), vendors/*/-INDENT-/*/, indent/*/-INDENT-/*/);
        }
      }
      // fake loop to detect the presence of keys in props.
      for (k in props){
        buf.push(
          /*/-INDENT-/*/indent + /*/-INDENT-/*/
          pfx + "{"
        );
        _declarations(props, buf, "", vendors/*/-INDENT-/*/, indent + "  "/*/-INDENT-/*/);
        buf.push(
          /*/-INDENT-/*/indent + /*/-INDENT-/*/
          "}"
        );
        break;
      }
      break;
    case ARRAY:
      statements.forEach(function (statement) {
        _add(statement, buf, pfx, vendors/*/-INDENT-/*/, indent/*/-INDENT-/*/);
      })
      break;
    case STRING:
        buf.push(
          /*/-INDENT-/*/indent + /*/-INDENT-/*/
          pfx.join(",") + "{" +
          /*/-INDENT-/*/"\n" + indent + "  " + /*/-INDENT-/*/
          statements/*/-INDENT-/*/.replace('\n', '\n' + indent + "  ")/*/-INDENT-/*/ + 
          /*/-INDENT-/*/"\n" + indent  + /*/-INDENT-/*/
          "}"
        );
    }
  }

  Sp.keyframes = function(name, frames) {
    m.vendors.forEach(function(vendor) {
      _add(
        _O("@-" + vendor + "-keyframes " + name, frames), this.buf, [""], [vendor]
        /*/-INDENT-/*/, ""/*/-INDENT-/*/
      );
    }, this)    
    _add(_O(
      "@keyframes " + name, frames), this.buf, [""], m.vendors
      /*/-INDENT-/*/, ""/*/-INDENT-/*/
    );
    return this;
  }

  Sp.font = function(o, buf) {
    buf = this.buf
    buf.push("@font-face{");
    _declarations(o, buf, "", [], "  ");
    buf.push("}");
    return this
  }

  Sp.toString = function () {
    return this.buf.join("\n");
  };
  /*/-statements-/*/

  var m = { // module
    /*/-statements-/*/
    sheet:sheet,
    /*/-statements-/*/
    inline: inline,
    vendors:["o", "ms", "moz", "webkit"]
  };

  return m;
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