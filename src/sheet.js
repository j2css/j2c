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

  case OBJECT:
    for (k in tree) if (own.call(tree, k)) {
      v = tree[k]

      if (prefix && /^[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1

          emit.s(prefix)

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
        inDeclaration = 0

        atRules(parser, emit,
          /^(.(?:-[\w]+-)?([_A-Za-z][-\w]*))\b\s*(.*?)\s*$/.exec(k) || [k,'@','',''],
          v, prefix, local, inAtRule
        )

      } else {
        // selector or nested sub-selectors
        inDeclaration = 0

        sheet(
          parser, emit,
          // `prefix` ... Hefty. Ugly. Sadly necessary.
          //
          (prefix && (/,/.test(prefix) || /,/.test(k))) ?

            /*0*/ (kk = splitSelector(prefix), splitSelector(
              local ?

                k.replace(
                  /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.L
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
                    /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.L
                  ) :

                  k,
                [prefix]
              ) :

              /*1*/ prefix + (
                local ?

                  k.replace(
                    /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g, parser.L
                  ) :

                  k
                ),
           v, local, inAtRule
        )

      }
    }

    break

  case ARRAY:
    for (k = 0; k < tree.length; k++){

      sheet(parser, emit, prefix, tree[k], local, inAtRule)

    }
    break

  case STRING:
    // CSS hacks or ouptut of `j2c.inline`.

    emit.s(prefix || ':-error-no-selector')

    declarations(parser, emit, '', tree, local)

  }
}

// The first entry in the filters array is actually the
// last step of the compiler. It inserts closing braces
// to close normal (non at-) rules (those that start with
// a selector). Doing it earlier is impossible without
// passing state around in unrelated code or ending up
// with duplicated selectors when the source tree contains
// arrays.
// There's no `S` handler, because the core compiler never
// calls it.
export function closeSelectors(next, inline) {
  var lastSelector
  return inline ? next : {
    i: function(){lastSelector = 0; next.i()},
    x: function (raw) {
      if (lastSelector) {next.S(); lastSelector = 0}
      return next.x(raw)
    },
    a: function (rule, param, takesBlock) {
      if (lastSelector) {next.S(); lastSelector = 0}
      next.a(rule, param, takesBlock)
    },
    A: function (rule) {
      if (lastSelector) {next.S(); lastSelector = 0}
      next.A(rule)
    },
    s: function (selector) {
      if (selector !== lastSelector){
        if (lastSelector) next.S()
        next.s(selector)
        lastSelector = selector
      }
    },
    d: next.d
  }
}
