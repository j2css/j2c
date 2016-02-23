import {type, ARRAY, OBJECT, STRING, ampersand, own, splitSelector} from './helpers'
import {declarations} from './declarations'
import {atRules} from './at-rules'



/**
 * Add rulesets and other CSS statements to the sheet.
 *
 * @param {array|string|object} statements - a source object or sub-object.
 * @param {string[]} emit - the contextual emitters to the final buffer
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {string} canCompose - are we allowed to @compose here?
 * @param {boolean} local - are we in @local or in @global scope?
 * @param {function} state - @local helper
 */
export function sheet(statements, emit, prefix, canCompose, local, state) {
  var k, v, inDeclaration, kk

  switch (type.call(statements)) {

  case ARRAY:
    for (k = 0; k < statements.length; k++){

      sheet(statements[k], emit, prefix, canCompose, local, state)

    }
    break

  case OBJECT:
    for (k in statements) if (own.call(statements, k)) {
      v = statements[k]
      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1

          emit.s((prefix), ' {\n')

        }
        if (/\$/.test(k)) {
          for (kk in (k = k.split('$'))) if (own.call(k, kk)) {

            declarations(v, emit, k[kk], local, state)

          }
        } else {

          declarations(v, emit, k, local, state)

        }
      } else if (/^@/.test(k)) {
        // Handle At-rules

        inDeclaration = (inDeclaration && emit.c('}\n') && 0)

        atRules(k, v, emit, prefix, canCompose, local, state)

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && emit.c('}\n') && 0)

        sheet(v, emit,
          (/,/.test(prefix) || prefix && /,/.test(k)) ?
          /*0*/ (kk = splitSelector(prefix), splitSelector( local ?

              k.replace(
                /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, state.l
              ) :

              k
            ).map(function (k) {
              return /&/.test(k) ? ampersand(k, kk) : kk.map(function(kk) {
                return kk + k
              }).join(',')
            }).join(',')) :
          /*0*/ /&/.test(k) ?
            /*1*/ ampersand(
              local ?

                k.replace(
                  /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, state.l
                ) :

                k,
              [prefix]
            ) :
            /*1*/ prefix + (
              local ?

                k.replace(
                  /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, state.l
                ) :

                k
              ),
          canCompose,
          local, state
        )
      }
    }

    if (inDeclaration) emit.c('}\n')

    break
  case STRING:
    // CSS hacks or ouptut of `j2c.inline`.

    emit.s(( prefix || ':-error-no-selector' ) , ' {\n')

    declarations(statements, emit, '', local, state)

    emit.c('}\n')
  }
}
