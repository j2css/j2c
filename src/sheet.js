import {type, ARRAY, OBJECT, STRING, cartesian, concat, splitSelector} from './helpers'
import {declarations} from './declarations'
import {at} from './at-rules'



/**
 * Add rulesets and other CSS statements to the sheet.
 *
 * @param {array|string|object} statements - a source object or sub-object.
 * @param {string[]} buf - the buffer in which the final style sheet is built
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {string} composes - the potential target of a @composes rule, if any
 * @param {boolean} local - are we in @local or in @global scope?
 * @param {object} ns - helper functions to populate or create the @local namespace
 *                      and to @composes classes
 * @param {function} ns.e - @composes helper
 * @param {function} ns.l - @local helper
 */
export function sheet(statements, buf, prefix, composes, local, ns) {
  var k, v, inDeclaration

  switch (type.call(statements)) {

  case ARRAY:
    for (k = 0; k < statements.length; k++)
      sheet(statements[k], buf, prefix, composes, local, ns)
    break

  case OBJECT:
    for (k in statements) {
      v = statements[k]
      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1
          buf.s(( prefix || '*' ), ' {\n')
        }
        declarations(v, buf, k, local, ns)
      } else if (/^@/.test(k)) {
        // Handle At-rules
        inDeclaration = (inDeclaration && buf.c('}\n') && 0)

        at(k, v, buf, prefix, composes, local, ns)

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && buf.c('}\n') && 0)

        sheet(v, buf,
          (/,/.test(prefix) || prefix && /,/.test(k)) ?
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
          composes || prefix ? '' : k,
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
    declarations(statements, buf, '', local, ns)
    buf.c('}\n')
  }
}
