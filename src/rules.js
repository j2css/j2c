import {type, ARRAY, OBJECT, STRING, ampersand, own, splitSelector} from './helpers'
import {declarations} from './declarations'

/**
 * Add rulesets and other CSS tree to the sheet.
 *
 * @param {object} frontend - holds the localizer- and walker-related methods
 *                            and state
 * @param {object} emit - the contextual emitters to the final buffer
 * @param {string} prefix - the current selector or a prefix in case of nested rules
 * @param {array|string|object} tree - a source object or sub-object.
 * @param {string} nestingDepth - are we nested in an at-rule?
 * @param {boolean} local - are we in @local or in @global scope?
 */
export function rules(frontend, emit, prefix, tree, local, nestingDepth) {
  var k, v, inDeclaration, kk

  switch (type.call(tree)) {

  case OBJECT:
    for (k in tree) if (own.call(tree, k)) {
      v = tree[k]

      if (prefix.length > 0 && /^\*?[-\w$]+$/.test(k)) {
        if (!inDeclaration) {
          inDeclaration = 1

          emit.rule(prefix)

        }
        if (k.indexOf('$') !== -1) {
          for (kk in (k = k.split('$'))) if (own.call(k, kk)) {

            declarations(frontend, emit, k[kk], v, local)

          }
        } else {

          declarations(frontend, emit, k, v, local)

        }

      } else if (k.charAt(0) === '@') {
        // Handle At-rules
        inDeclaration = 0

        frontend.atrules(frontend, emit,
          /^(.(?:-[\w]+-)?([_A-Za-z][-\w]*))\b\s*([\s\S]*?)\s*$/.exec(k) || [k,'@','',''],
          v, prefix, local, nestingDepth
        )

      } else {
        // selector or nested sub-selectors
        inDeclaration = 0

        if (k === '') {
          emit._rule()
          emit.err("Invalid selector ''")
          continue
        }

        rules(
          frontend, emit,
          // build the selector `prefix` for the next iteration.
          // ugly and full of redundant bits but so far the fastest/shortest.gz
          /*0 if*/(prefix.length > 0 && (prefix.indexOf(',') + k.indexOf(',') !== -2)) ?

            /*0 then*/ (kk = splitSelector(prefix), splitSelector(
              local ?

                k.replace(
                  /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g,
                  frontend.localizeReplacer
                ) :

                k
            ).map(function (k) {
              return (k.indexOf('&') !== -1) ? ampersand(k, kk) : kk.map(function(kk) {
                return kk + k
              }).join(',')
            }).join(',')) :

            /*0 else*/ /*1 if*/ (k.indexOf('&') !== -1) ?

              /*1 then*/ ampersand(
                local ?

                  k.replace(
                    /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g,
                    frontend.localizeReplacer
                  ) :

                  k,
                [prefix]
              ) :

              /*1 else*/ prefix + (
                local ?

                  k.replace(
                    /("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\/)|:global\(\s*(\.-?[_A-Za-z][-\w]*)\s*\)|(\.)(-?[_A-Za-z][-\w]*)/g,
                    frontend.localizeReplacer
                  ) :

                  k
                ),
           v, local, nestingDepth + 1
        )

      }
    }

    break

  case ARRAY:
    for (k = 0; k < tree.length; k++){

      rules(frontend, emit, prefix, tree[k], local, nestingDepth)

    }
    break

  case STRING:
    // CSS hacks or ouptut of `j2c.inline`. Even raw rulesets if in top position.

    if (prefix.length) emit.rule(prefix)

    emit.raw(tree)

  }
}

// This is the first entry in the filters array, which is
// actually the last step of the compiler. It inserts
// closing braces to close normal (non at-) rules (those
// that start with a selector). Doing it earlier is
// impossible without passing frontend around in unrelated code
// or ending up with duplicated selectors when the source tree
// contains arrays.
// There's no `_rule` handler, because the core compiler never
// calls it.
export function closeSelectors(next, inline) {
  var lastSelector
  return inline ? next : {
    init: function(){lastSelector = ''; next.init()},
    done: function () {
      if (lastSelector) {next._rule(); lastSelector = ''}
      return next.done()
    },
    atrule: function (rule, kind, param, takesBlock) {
      if (lastSelector) {next._rule(); lastSelector = ''}
      next.atrule(rule, kind, param, takesBlock)
    },
    _atrule: function (rule) {
      if (lastSelector) {next._rule(); lastSelector = ''}
      next._atrule(rule)
    },
    rule: function (selector) {
      if (selector !== lastSelector){
        if (lastSelector) next._rule()
        next.rule(selector)
        lastSelector = selector
      }
    },
    _rule: function(){
      if (lastSelector) {next._rule(); lastSelector = ''}
    }
  }
}
