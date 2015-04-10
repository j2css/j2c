(function () {
  var
    OBJECT = "[object Object]",
    NUMBER = "[object Number]",
    STRING = "[object String]",
    ARRAY = "[object Array]",
    type = properties.call.bind(({}).toString),
    counter = 0;

  function vendorify(prop, buf, indent, vendors) {
    vendors = vendors || m.vendors;
    vendors.forEach(function (v) {
      buf.push(indent + "-" + v + "-" + prop);
    })
    buf.push(indent + prop)
  }

  function properties(o) {
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

  function RuleSet(pfx) {
    if (!(this instanceof RuleSet)) {return new RuleSet(pfx)};
    this.prefix = pfx != null ? pfx : m.prefix + (counter++);
    this.buf = []
  }
  
  var Rp = RuleSet.prototype;

  Rp.add = function (rules) {
    _add(rules, this.buf, this.prefix + " ", "");
    return this
  };

  function _add(rules, buf, pfx, indent /*var*/, k, v, t, props) {
    props = {};
    switch (type(rules)) {
    case OBJECT:
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
          _add(v, buf, pfx + k, indent);
        }
      }
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
        buf.push(indent + pfx + "{\n" + rules + "\n" + indent  + "}");
    }
  }

  Rp.toString = function () {
    return this.buf.join("\n");
  };

  var m = {
    properties: properties,
    vendors:["o", "ms", "moz", "webkit"],
    unit: "px",
    prefix:".Dimrill_" + Date.now() + "_",
    indent: "  ",
    RuleSet: RuleSet
  };

  return m;
})();