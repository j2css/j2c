;var j2c = (function () {
  /*jslint bitwise: true*/
  var
    j2c = {},
    empty = [],
    type = j2c.toString,
    own =  j2c.hasOwnProperty,
    OBJECT = type.call(j2c),
    ARRAY =  type.call(empty),
    STRING = type.call(""),
    propertyName = /^[-\w$]+$/,
    scope_root = "_j2c_" + (Math.random() * 1e9 | 0) + "_" + 1 * (new Date()) + "_",
    counter = 0;

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
          for (kk in (k = k.split("$").reverse())) if (own.call(k, kk))
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
      k = (prefix && (prefix).replace(/_/g, "-") + ":");

      /*/-statements-/*/
      if (localize && (k == "animation-name:" || k == "animation:")) {
        o = o.split(',').map(function(o){
          return o.replace(/([-\w]+)/, localize);
        }).join(",");
      }
      /*/-statements-/*/

      buf.push(o = k + o + ";");
      // vendorify
      for (k = vendors.length; k--;)
         buf.push("-" + vendors[k] + "-" + o);
    }
  }


  

  /*/-statements-/*/
  function _cartesian(a,b, selectorP, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(_concat(a[i], b[j], selectorP));
    return res;
  }

  function _concat(a, b, selectorP) {
    if (selectorP && b.match(propertyName)) throw "invalid selector '" + b +  "'";
    return selectorP && b.indexOf("&") + 1 ? b.replace(/&/g, a) : a + b;
  }


  // Add rulesets and other CSS statements to the sheet.
  function _add(statements, buf, prefix, vendors, localize, /*var*/ k, v, decl) {
    // optionally needed in the "[object String]" case
    // where the `statements` variable actually holds
    // declaratons. This allows to process either a 
    // string or a declarations object with the same code.
    decl = statements;

    switch (type.call(statements)) {

    case ARRAY:
      for (k = statements.length;k--;)
        _add(statements[k], buf, prefix, vendors, localize);
      break;

    case OBJECT:
      decl = {};
      for (k in statements) if (k[0] == "@") { // Handle At-rules
        v = statements[k];

        if (type.call(v) == STRING) {
          buf.push(k + " " + v + ";");

        } else if (k.match(/^@keyframes /)) {
          k = localize ? k.replace(/ ([-\w]+)/, localize) : k;
          buf.push("}");
          _add(v, buf, "", vendors, localize);
          buf.push(k + "{");

          // add a @-webkit-keyframes block too.
          buf.push("}");
          _add(v, buf, "", ["webkit"]);
          buf.push("@-webkit-" + k.slice(1) + "{");

        } else if (k.match(/^@font-face/)) {
          _add(v, buf, k, empty);

        } else { 
          // default @-rule (usually @media)
          buf.push("}");
          _add(v, buf, prefix, vendors, localize);
          buf.push(k + "{");
        }
      }
      for (k in statements) {
        v = statements[k];
        if (k.match(propertyName)) {
          // It is a declaration.
          decl[k] = v;

        } else if (k[0] != "@") {
          // nested sub-selectors
          _add(v, buf,
            /* if prefix and/or k have a coma */
            prefix.indexOf(",") + k.indexOf(",") + 2 ?
            /* then */
              _cartesian(prefix.split(","), k.split(","), 1).join(",") :
            /* else */
              _concat(prefix, k, 1),
            vendors,
            localize
          );
        }
      }
      // fall through for handling declarations. The next line is for JSLint.
      /* falls through */
    case STRING:
      // fake loop to detect the presence of declarations.
      // runs if decl is a non-empty string or when falling
      // through from the `Object` case, when there are
      // declarations.
      for (k in decl) if (own.call(decl, k)){
        buf.push("}");
        _declarations(decl, buf, "", vendors, localize);
        buf.push((localize ? prefix.replace(/\.([-\w]+)/g, localize) : prefix || "*") + "{");
        break;
      }
    }
  }

  function _finalize(buf, postprocess) {
    if (postprocess) postprocess(buf);
    return buf.reverse().join("\n");
  }

  j2c.inline = function (o, vendors, buf) {
    _declarations(o, buf = [], "", vendors || empty);
    return _finalize(buf);
  };

  j2c.sheet = function (statements, options, buf, k) {
    options = options || {};
    var global = options.global || [],
    suffix = scope_root + counter++,
    locals = {};
    _add(statements, buf = [], "", options.vendors || empty, global === true ? false : function (match, k) {
      if (global.indexOf(match) + 1 || match[0] != '.' && global.indexOf(k) + 1) return match;
      if (!locals[k]) (locals[k] = k + suffix);
      return match + suffix;
    });
    /*jshint -W053 */
    buf = new String(_finalize(buf, options.then)); 
    /*jshint +W053 */
    for (k in locals) if (own.call(locals, k)) buf[k] = locals[k];
    return buf;
  };
  /*/-statements-/*/

  j2c.prefix = function(val, vendors) {
    return _cartesian(
      vendors.map(function(p){return "-" + p + "-";}).concat([""]),
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