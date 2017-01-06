import {blankFixers, browserDetector, finalizeFixers} from './fixers.js'


export function createPrefixPlugin() {
  var fixers = blankFixers()
  if (typeof getComputedStyle === 'function') browserDetector(fixers)
  finalizeFixers(fixers)

  var cache = []

  prefixPlugin.setFixers = function(f) {
    if (cache.indexOf(f) === -1) {
      finalizeFixers(f)
      cache.push(f)
    }
    fixers = f
    return prefixPlugin
  }

  function prefixPlugin() {
    return {
      $filter: function(next) {
        return {
          atrule: function(rule, kind, params, hasBlock) {
            next.atrule(
              fixers.hasAtrules && fixers.atrules[rule] || rule,
              kind,
              (
                kind === 'media'    ? fixers.fixAtMediaParams(params) :
                kind === 'supports' ? fixers.fixAtSupportsParams(params) :
                params
              ),
              hasBlock
            )
          },
          decl: function(property, value) {
            if (fixers.oldFlexBox && property === 'flex-direction' && typeof value === 'string') {
              next.decl(fixers.properties['box-orient'], value.indexOf('column') > -1 ? 'vertical' : 'horizontal')
              next.decl(fixers.properties['box-direction'], value.indexOf('reverse') > -1 ? 'reverse' : 'normal')
            } else {
              next.decl(
                fixers.properties[property] || fixers.fixProperty(property),
                fixers.fixValue(value, property)
              )
            }
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
  return prefixPlugin
}

export var plugin = createPrefixPlugin()
