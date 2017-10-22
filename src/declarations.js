import {own, type, ARRAY, OBJECT} from './helpers'

function decamelize(match) {
  return '-' + match.toLowerCase()
}

/**
 * Handles the property:value; pairs.
 *
 * @param {object} frontend - holds the localizer- and walker-related methods
 *                            and state
 * @param {object} emit - the contextual emitters to the final buffer
 * @param {string} prefix - the current property or a prefix in case of nested
 *                          sub-properties.
 * @param {array|object|string} o - the declarations.
 * @param {boolean} local - are we in @local or in @global scope.
 */

export function declarations(frontend, emit, prefix, o, local) {
  var k, v, kk
  if (o==null) return

  switch ( type.call(o = o.valueOf()) ) {
  case ARRAY:
    for (k = 0; k < o.length; k++)

      declarations(frontend, emit, prefix, o[k], local)

    break
  case OBJECT:
    // prefix is falsy iif it is the empty string, which means we're at the root
    // of the declarations list.

    for (k in o) if (own.call(o, k)){
      v = o[k]
      if (k.indexOf('$') !== -1) {
        for (kk in (k = k.split('$'))) if (own.call(k, kk)) {

          declarations(frontend, emit, prefix + k[kk], v, local)

        }
      } else {

        declarations(frontend, emit, prefix + k, v, local)

      }
    }
    break
  default:
    // prefix is falsy when it is "", which means that we're
    // at the top level.
    // `o` is then treated as a `property:value` pair, or a
    // semi-colon-separated list thereof.
    if (!prefix) return emit.raw(o)

    // Otherwise, `prefix` is the property name, and
    // `o` is the value.

    // restore the dashes
    k = prefix.replace(/[A-Z]/g, decamelize)

    if (local && (k == 'animation-name' || k == 'animation')) {
      // no need to tokenize here a plain `.split(',')` has all bases covered.
      // We may 'localize' a comment, but it's not a big deal.
      o = o.split(',').map(function (o) {

        return o.replace(/^\s*(?:(var\([^),]+(?:\)|$))|(?:var\([^,]+,\s*)??:?global\(\s*([_A-Za-z][-\w]*)\s*\)|(?:var\([^,]+,\s*)??()(-?[_A-Za-z][-\w]*))/, frontend.localizeReplacer)

      }).join(',')
    }

    emit.decl(k, o)
  }
}
