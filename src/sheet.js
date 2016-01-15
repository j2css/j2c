import {type, ARRAY, OBJECT, STRING, cartesian, concat} from './helpers'
import {declarations} from './declarations'
import {at} from './at-rules'

// Add rulesets and other CSS statements to the sheet.
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
          buf.push(( prefix || '*' ) + ' {')
        }
        declarations(v, buf, k, vendors, local, ns)
      } else if (/^@/.test(k)) {
        // Handle At-rules
        inDeclaration = (inDeclaration && buf.push('}') && 0)

        at(k, v, buf, prefix, rawPrefix, vendors, local, ns)

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && buf.push('}') && 0)

        sheet(v, buf,
          (kk = /,/.test(prefix) || prefix && /,/.test(k)) ?
            cartesian(prefix.split(','), ( local ?
          k.replace(
            /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
          ) : k
        ).split(','), prefix).join(',') :
            concat(prefix, ( local ?
          k.replace(
            /()(?::global\(\s*(\.[-\w]+)\s*\)|(\.)([-\w]+))/g, ns.l
          ) : k
        ), prefix),
          kk ?
            cartesian(rawPrefix.split(','), k.split(','), rawPrefix).join(',') :
            concat(rawPrefix, k, rawPrefix),
          vendors,
          local, ns
        )
      }
    }
    if (inDeclaration) buf.push('}')
    break
  case STRING:
    buf.push(
        ( prefix || ':-error-no-selector' ) + ' {'
      )
    declarations(statements, buf, '', vendors, local, ns)
    buf.push('}')
  }
}
