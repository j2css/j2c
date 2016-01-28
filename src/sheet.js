import {type, ARRAY, OBJECT, STRING, cartesian, concat, splitSelector} from './helpers'
import {declarations} from './declarations'
import {at} from './at-rules'



/**
 * Add rulesets and other CSS statements to the sheet.
 *
 * @param {array|string|object} statements - a source object or sub-object.
 * @param {string[]} buf - the buffer in which the final style sheet is built
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {string} rawPrefix - as above, but without localization transformations
 * @param {string} vendors - a list of vendor prefixes
 * @Param {boolean} local - are we in @local or in @global scope?
 * @param {object} ns - helper functions to populate or create the @local namespace
 *                      and to @extend classes
 * @param {function} ns.e - @extend helper
 * @param {function} ns.l - @local helper
 */
export function sheet(statements, buf, prefix, rawPrefix, vendors, local, ns) {
  var k, kk, v, inDeclaration

  switch (type.call(statements)) {

  case ARRAY:
    for (k = 0; k < statements.length; k++)
      sheet(statements[k], buf, prefix, rawPrefix, vendors, local, ns)
    break

  case OBJECT:
    for (k in statements) {
      v = statements[k]
      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1
          buf.s(( prefix || '*' ), ' {\n')
        }
        declarations(v, buf, k, vendors, local, ns)
      } else if (/^@/.test(k)) {
        // Handle At-rules
        inDeclaration = (inDeclaration && buf.c('}\n') && 0)

        at(k, v, buf, prefix, rawPrefix, vendors, local, ns)

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && buf.c('}\n') && 0)

        sheet(v, buf,
          (kk = /,/.test(prefix) || prefix && /,/.test(k)) ?
            cartesian(splitSelector(prefix), splitSelector( local ?
              k.replace(
                /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
              ) : k
            ), prefix).join(',') :
            concat(prefix, ( local ?
              k.replace(
                /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
              ) : k
            ), prefix),
          kk ?
            cartesian(splitSelector(rawPrefix), splitSelector(k), rawPrefix).join(',') :
            concat(rawPrefix, k, rawPrefix),
          vendors,
          local, ns
        )
      }
    }
    if (inDeclaration) buf.c('}\n')
    break
  case STRING:
    buf.s(
        ( prefix || ':-error-no-selector' ) , ' {\n'
      )
    declarations(statements, buf, '', vendors, local, ns)
    buf.c('}\n')
  }
}
