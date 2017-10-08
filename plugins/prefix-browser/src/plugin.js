import {blankFixers, browserDetector, finalizeFixers, fixDecl} from './fixers.js'

var commonFixers

export function initBrowser() { // exported for the test suite
  commonFixers = blankFixers()
  if (typeof getComputedStyle === 'function') browserDetector(commonFixers)
  finalizeFixers(commonFixers)
}
initBrowser()

export function prefixPlugin(){
  var fixers = commonFixers
  var cache = []
  return {
    set: {
      setPrefixDb: function(f) {
        if (cache.indexOf(f) === -1) {
          finalizeFixers(f)
          cache.push(f)
        }
        fixers = f
        return prefixPlugin
      }
    },
    filter: function(next) {
      return {
        atrule: function(rule, kind, params, hasBlock) {
          next.atrule(
            fixers.hasAtrules && fixers.atrules[rule] || rule,
            kind,
            (
              rule === '@media'    ? fixers.fixAtMediaParams(params) :
              rule === '@supports' ? fixers.fixAtSupportsParams(params) :
              params
            ),
            hasBlock
          )
        },
        decl: function(property, value) {
          fixDecl(fixers, next.decl, property, value)
        },
        rule: function(selector) {
          next.rule(
            fixers.hasSelectors ? fixers.fixSelector(selector) : selector
          )
        }
      }
    }
  }
}
