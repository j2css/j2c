import {type, ARRAY, OBJECT, STRING, ampersand, own, splitSelector} from './helpers'
import {declarations} from './declarations'
import {atRules} from './at-rules'



/**
 * Add rulesets and other CSS tree to the sheet.
 *
 * @param {object} parser - holds the parser-related methods and state
 * @param {object} emit - the contextual emitters to the final buffer
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {array|string|object} tree - a source object or sub-object.
 * @param {string} inAtRule - are we nested in an at-rule?
 * @param {boolean} local - are we in @local or in @global scope?
 */
export function sheet(parser, emit, prefix, tree, local, inAtRule) {
  var k, v, inDeclaration, kk

  switch (type.call(tree)) {

  case ARRAY:
    for (k = 0; k < tree.length; k++){

      sheet(parser, emit, prefix, tree[k], local, inAtRule)

    }
    break

  case OBJECT:
    for (k in tree) if (own.call(tree, k)) {
      v = tree[k]
      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1

          emit.s((prefix), ' {\n')

        }
        if (/\$/.test(k)) {
          for (kk in (k = k.split('$'))) if (own.call(k, kk)) {

            declarations(parser, emit, k[kk], v, local)

          }
        } else {

          declarations(parser, emit, k, v, local)

        }
      } else if (/^@/.test(k)) {
        // Handle At-rules

        inDeclaration = (inDeclaration && emit.c('}\n') && 0)

        atRules(parser, emit,
          /^(.(?:-[\w]+-)?([_A-Za-z][-\w]*))\b\s*(.*?)\s*$/.exec(k) || ['@','@','',''],
          v, prefix, local, inAtRule
        )

      } else {
        // selector or nested sub-selectors

        inDeclaration = (inDeclaration && emit.c('}\n') && 0)

        sheet(
          parser, emit,
          // prefix... Hefty. Ugly. Sadly necessary.
          (/,/.test(prefix) || prefix && /,/.test(k)) ?
          /*0*/ (kk = splitSelector(prefix), splitSelector( local ?

              k.replace(
                /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.l
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
                  /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.l
                ) :

                k,
              [prefix]
            ) :
            /*1*/ prefix + (
              local ?

                k.replace(
                  /:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.l
                ) :

                k
              ),
           v, local, inAtRule
        )
      }
    }

    if (inDeclaration) emit.c('}\n')

    break
  case STRING:
    // CSS hacks or ouptut of `j2c.inline`.

    emit.s(( prefix || ':-error-no-selector' ) , ' {\n')

    declarations(parser, emit, '', tree, local)

    emit.c('}\n')
  }
}
