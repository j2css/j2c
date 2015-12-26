import {type, ARRAY, OBJECT, STRING, own, emptyArray, cartesian, concat} from './helpers'
import {declarations} from './declarations';

// Add rulesets and other CSS statements to the sheet.
export function sheet(statements, buf, prefix, vendors, localize, /*var*/ k, kk, v, decl, at) {
  // optionally needed in the "[object String]" case
  // where the `statements` variable actually holds
  // declaratons. This allows to process either a
  // string or a declarations object with the same code.

  decl = statements;

  switch (type.call(statements)) {

  case ARRAY:
    for (k = 0; k < statements.length; k++)
      sheet(statements[k], buf, prefix, vendors, localize);
    break;

  case OBJECT:
    decl = {};
    for (k in statements) {
      v = statements[k];
      if (/^[-\w$]+$/.test(k)) {
        // It is a declaration.
        decl[k] = v;
      } else if (k[0] == "@") {
        // Handle At-rules
        if (/^.(?:namespace|import|charset)/.test(k)) {
          if(type.call(v) == ARRAY){
            for (kk = 0; kk < v.length; kk ++) {
              buf.push(k + " " + v[kk] + ";");
            }
          } else {
            buf.push(k + " " + v + ";");
          }
        } else if (/^.keyframes /.test(k)) {
          k = localize ? k.replace(/( )(?:(?::global\(([-\w]+)\))|(?:()([-\w]+)))/, localize) : k;
          // add a @-webkit-keyframes block too.

          buf.push("@-webkit-" + k.slice(1) + "{");
          sheet(v, buf, "", ["webkit"]);
          buf.push("}");

          buf.push(k + "{");
          sheet(v, buf, "", vendors, localize);
          buf.push("}");


        } else if (/^.(?:font-face|viewport|page )/.test(k)) {
          sheet(v, buf, k, emptyArray);

        } else if (/^.global/.test(k)) {
          sheet(v, buf, (localize ? prefix.replace(/()(?:(?::global\((\.[-\w]+)\))|(?:(\.)([-\w]+)))/g, localize) : prefix), vendors);

        } else {
          // conditional block (@media @document or @supports)
          at = true;
        }
      } else {
        // nested sub-selectors
        sheet(v, buf,
          /* if prefix and/or k have a coma */
          prefix.indexOf(",") + k.indexOf(",") + 2 ?
          /* then */
            cartesian(prefix.split(","), k.split(","), 1).join(",") :
          /* else */
            concat(prefix, k, 1),
          vendors,
          localize
        );
      }
    }
    // fall through for handling declarations. The next line is for JSHint.
    /* falls through */
  case STRING:
    // compute the selector.
    v = (localize ? prefix.replace(/()(?:(?::global\((\.[-\w]+)\))|(?:(\.)([-\w]+)))/g, localize) : prefix) || "*";
    // fake loop to detect the presence of declarations.
    // runs if decl is a non-empty string or when falling
    // through from the `Object` case, when there are
    // declarations.
    // We could use `Object.keys(decl).length`, but it would
    // allocate an array for nothing. It also requires polyfills
    // for ES3 browsers.
    for (k in decl) if (own.call(decl, k)){
      buf.push(v + "{");
      declarations(decl, buf, "", vendors, localize);
      buf.push("}");
      break;
    }
  }

  // Add conditional, nestable at-rules at the end.
  // The current architecture prevents from putting them
  // in place, and putting them before may end up in accidentally shadowing
  // rules of the conditional block with unconditional ones.
  if (at) for (k in statements) if (/^@(?:media|document|supports)/.test(k)) {
    buf.push(k + "{");
    sheet(statements[k], buf, prefix, vendors, localize);
    buf.push("}");
  }
}
