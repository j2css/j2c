/*/-notice-/*//*
This source file is incomplete and useless in itself.

It is augmented for the various module systems by the build script.

The -statements- section is discarded in the `inline` builds.

See the 'dist' directory for usable files.

*//*/-notice-/*/(function () {
  var
    type = ({}).toString,
    own =  ({}).hasOwnProperty,
    OBJECT = type.call({}),
    ARRAY =  type.call([]),
    STRING = type.call(""),
    default_scope = ".j2c_" + (Math.random() * 1e9 | 0) + "_",
    counter = 0;

  function _cartesian(a,b, selectorP, res, i, j) {
    res = [];
    for (j in b) if(own.call(b, j))
      for (i in a) if(own.call(a, i))
        res.push(_concat(a[i], b[j], selectorP));
    return res;
  }

  function _concat(a, b, selectorP) {
    return selectorP && b.indexOf("&") + 1 ? b.replace("&", a) : a + b
  }

  // Handles the property:value; pairs.
  function _declarations(o, buf, pfx, vendors, /*var*/ k, v, kk) {
    switch (type.call(o)) {
    case ARRAY:
      for (k = o.length;k--;)
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
      buf.push(o = (pfx && (pfx).replace(/_/g, "-") + ":") + o + ";");
      // vendorify
      for (k = vendors.length; k--;)
         buf.push("-" + vendors[k] + "-" + o);
    }
  }

  function j2c(o, buf) {
    _declarations(o, buf = [], "", j2c.vendors);
    return buf.reverse().join("");
  }


  /*/-statements-/*/
  function Sheet(scope) {
    this.scope = (scope != null ? scope : default_scope + (counter++));
    this.buf = [];
  }

  Sheet.prototype = Sheet;

  Sheet.add = function (statements) {
    _add(statements, this.buf, this.scope, j2c.vendors);
    return this;
  };

  // Add rulesets and other CSS statements to the sheet.
  function _add(statements, buf, pfx, vendors, /*var*/ k, v, decl) {
    // optionally needed in the "[object String]" case
    // where the `statements` variable actually holds
    // declaratons. This allows to process either a 
    // string or a declarations object with the same code.
    decl = statements

    switch (type.call(statements)) {

    case ARRAY:
      for (k = statements.length;k--;)
        _add(statements[k], buf, pfx, vendors);
      break;

    case OBJECT:
      decl = {};
      for (k in statements) {
        v = statements[k];
        if (k[0] == "@"){ // Handle At-rules

          if (k.match(/^@keyframes /)) {
            buf.push("}");
            _add(v, buf, "", vendors);
            buf.push(k + "{");

            // add a @-webkit-keyframes block too.
            buf.push("}");
            _add(v, buf, "", ["webkit"]);
            buf.push("@-webkit-" + k.slice(1) + "{");

          } else if (k.match(/^@font-face/)) {
            _add(v, buf, k, [])

          } else if (type.call(v) == STRING) {
            buf.push(k + " " + v + ";");

          } else { 
            // default @-rule (usually @media)
            buf.push("}");
            _add(v, buf, pfx, vendors);
            buf.push(k + "{");
          }
        } else if (k.match(/^[-\w$]+$/)) {
          // It is a declaration.
          decl[k] = v;

        } else { // A sub-selector
          _add(v, buf,
            /* if pfx and/or k have a coma */
              pfx.indexOf(",") + k.indexOf(",") + 2 ?
            /* then */
              _cartesian(pfx.split(","), k.split(","), 1).join(",") :
            /* else */
              _concat(pfx, k, 1)
            ,
            vendors
          );
        }
      }
      // fall through for handling declarations.

    case STRING:
      // fake loop to detect the presence of declarations.
      // runs if decl is a non-empty string or when falling
      // through from the `Object` case, when there are
      // declarations.
      for (k in decl) if (own.call(decl, k)){
        buf.push("}");
        _declarations(decl, buf, "", vendors);
        buf.push(pfx + "{");
        break;
      }
    }
  }

  Sheet.toString = Sheet.valueOf = function () {
    return this.buf.reverse().join("");
  };

  j2c.sheet = function (s) {return ""+new Sheet("").add(s);};
  j2c.scoped = function(o, k, sheet) {
    var classes = {},
        styles = "";
    for (k in o) if (own.call(o, k)) {
      sheet = new Sheet().add(o[k])
      classes[k] = sheet.scope
      styles += sheet
    }
    return {classes:classes, styles:styles}
  }
  /*/-statements-/*/

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
*/