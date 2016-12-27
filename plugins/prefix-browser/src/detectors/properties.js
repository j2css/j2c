// Derived from Lea Verou's PrefixFree

import {styleElement, supportedProperty} from './utils.js'

export function detectProperties(fixers) {
  if (fixers.prefix === '') return

  var properties = fixers.propertyList
  // Get properties ONLY supported with a prefix
  for(var i=0; i<properties.length; i++) {
    var property = properties[i]

    if(property.indexOf(fixers.prefix) === 0) { // we might have multiple prefixes, like Opera
      var unprefixed = property.slice(fixers.prefix.length)

      if(!supportedProperty(unprefixed)) {
        fixers.fixProperties = true
        fixers.properties[unprefixed] = property
      }
    }
  }
  // IE fix
  if(fixers.Prefix == 'Ms'
    && !('transform' in styleElement)
    && !('MsTransform' in styleElement)
    && ('msTransform' in styleElement)) {
    fixers.fixProperties = true
    fixers.properties['transform'] = '-ms-transform'
    fixers.properties['transform-origin'] = '-ms-transform-origin'
  }
}