import {own, type, ARRAY, OBJECT} from './helpers'

function decamelize(match) {
  return '-' + match.toLowerCase()
}

/**
 * Handles the property:value; pairs.
 *
 * @param {object} parser - holds the parser-related methods and state
 * @param {object} emit - the contextual emitters to the final buffer
 * @param {string} prefix - the current property or a prefix in case of nested
 *                          sub-properties.
 * @param {array|object|string} o - the declarations.
 * @param {boolean} local - are we in @local or in @global scope.
 */

export function declarations(parser, emit, prefix, o, local) {
  var k, v, kk
  if (o==null) return

  switch ( type.call(o = o.valueOf()) ) {
  case ARRAY:
    for (k = 0; k < o.length; k++)

      declarations(parser, emit, prefix, o[k], local)

    break
  case OBJECT:
    // prefix is falsy iif it is the empty string, which means we're at the root
    // of the declarations list.
    prefix = (prefix && prefix + '-')
    for (k in o) if (own.call(o, k)){
      v = o[k]
      if (/\$/.test(k)) {
        for (kk in (k = k.split('$'))) if (own.call(k, kk)) {

          declarations(parser, emit, prefix + k[kk], v, local)

        }
      } else {

        declarations(parser, emit, prefix + k, v, local)

      }
    }
    break
  default:
    // prefix is falsy when it is "", which means that we're
    // at the top level.
    // `o` is then treated as a `property:value` pair, or a
    // semi-colon-separated list thereof.
    // Otherwise, `prefix` is the property name, and
    // `o` is the value.

    // restore the dashes
    k = prefix.replace(/_/g, '-').replace(/[A-Z]/g, decamelize)

    if (local && (k == 'animation-name' || k == 'animation' || k == 'list-style')) {
      // no need to tokenize here a plain `.split(',')` has all bases covered.
      // We may 'parser' a comment, but it's not a big deal.
      o = o.split(',').map(function (o) {

        return o.replace(/:?global\(\s*([_A-Za-z][-\w]*)\s*\)|()(-?[_A-Za-z][-\w]*)/, parser.l)

      }).join(',')
    }

    emit.d(k, k ? ':': '', o, ';\n')

  }
}
