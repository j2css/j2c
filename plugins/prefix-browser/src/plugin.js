import {blankFixers, browserDetector, finalizeFixers} from './fixers.js'


export function prefixPlugin() {
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
                rule === '@media'    ? fixers.fixAtMediaParams(params) :
                rule === '@supports' ? fixers.fixAtSupportsParams(params) :
                params
              ),
              hasBlock
            )
          },
          decl: function decl(property, value) {
            if (!property || !(typeof value === 'string' || typeof value === 'number')){
              return next.decl(fixers.properties[property] || fixers.fixProperty(property), value)
            }
            value = value + ''
            if (property === 'flex-flow' && fixers.flexbox2009) {
              value.split(' ').forEach(function(v){
                // recurse! The lack of `next.` is intentional.
                if (v.indexOf('wrap') > -1) decl('flex-wrap', v)
                else if(v !== '') decl('flex-direction', v)
              })
            } else if (property === 'flex-direction' && fixers.flexbox2009) {
              next.decl(fixers.properties['box-orient'], value.indexOf('column') > -1 ? 'block-axis' : 'inline-axis')
              next.decl(fixers.properties['box-direction'], value.indexOf('-reverse') > -1 ? 'reverse' : 'normal')
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
