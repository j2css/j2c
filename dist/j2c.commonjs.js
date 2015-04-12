module.exports = (function () {
  var
    OBJECT = "[object Object]",
    NUMBER = "[object Number]",
    STRING = "[object String]",
    ARRAY =  "[object Array]",
    type = inline.call.bind(({}).toString),
    counter = 0;

  function vendorify(prop, buf, indent, vendors) {
    vendors = vendors || m.vendors;
    vendors.forEach(function (v) {
      buf.push(indent + "-" + v + "-" + prop);
    })
    buf.push(indent + prop)
  }

  function inline(o) {
    var buf = [];
    _properties(o, buf, "", "");
    return buf.join("\n");
  }

  function _properties(o, buf, pfx, indent /**/, k, t, v) {
    for (k in o) {
      v = o[k];
      t = type(v);
      switch (t) {
      case ARRAY:
        v.forEach(function (vv, oo) {
          oo = {};
          oo[k] = vv;
          _properties(oo, buf, pfx, indent);
        });
        break;
      case OBJECT:
        _properties(v, buf, pfx + k + "-", indent);
        break;
      default:
        vendorify(
          pfx + k + ":" + (t !== NUMBER || v === 0 ? v : v + m.unit) + ";",
          buf, indent
        );
      }
    }
  }

  /**///rules
  function RuleSet(pfx) {
    if (!(this instanceof RuleSet)) {return new RuleSet(pfx)};
    this.prefix = (pfx != null ? pfx : m.prefix + (counter++));
    this.buf = []
  }
  
  var Rp = RuleSet.prototype;

  Rp.add = function (rules) {
    _add(rules, this.buf, this.prefix.split(","), "");
    return this
  };

  function cross(a,b) {
    var res = [];
    for (var i = 0, j; i< a.length; i++) 
      for (j = 0; j < b.length; j++)
        res.push(a[i]+b[j]);
    return res;
  }

  function _add(rules, buf, pfx, indent /*var*/, k, v, t, props) {
    switch (type(rules)) {
    case OBJECT:
      props = {};
      for (k in rules) {
        v = rules[k];
        t = type(v);
        if (k[0] == "@"){
          if (t == OBJECT) {
            buf.push(indent + k + "{");
            _add(v, buf, pfx, indent + m.indent);
            buf.push(indent + "}");
          } else {
            buf.push(k + " " + v + ";");
          }
        } else if (k.match(/^[-\w]+$/)) {
          props[k] = v;
        } else {
          _add(v, buf, cross(pfx, k.split(",")), indent);
        }
      }
      // fake loop to detect the presence of keys in props.
      for (k in props){
        buf.push(indent + pfx + "{");
        _properties(props, buf, "", indent + m.indent);
        buf.push(indent + "}");
        break;
      }
      break;
    case ARRAY:
      rules.forEach(function (rules) {
        _add(rules, buf, pfx, indent);
      })
      break;
    case STRING:
        buf.push(indent + pfx.join(",") + "{\n" + rules + "\n" + indent  + "}");
    }
  }

  Rp.toString = function () {
    return this.buf.join("\n");
  };
  /**///rules

  var m = {
    /**///rules
    prefix:".j2c_" + (Math.random() * 1e9 | 0) + "_",
    indent: "  ",
    RuleSet: RuleSet,
    /**///rules
    inline: inline,
    vendors:["o", "ms", "moz", "webkit"],
    unit: "px"
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
*/;