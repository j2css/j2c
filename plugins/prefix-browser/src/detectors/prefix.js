// Derived from Lea Verou's PrefixFree

import {
  allStyles,
  camelCase, deCamelCase, supportedProperty
} from './utils.js'

export function detectPrefix(fixers) {
  var prefixCounters = {}
  var properties = fixers.propertyList
  // Why are we doing this instead of iterating over properties in a .style object? Because Webkit.
  // 1. Older Webkit won't iterate over those.
  // 2. Recent Webkit will, but the 'Webkit'-prefixed properties are not enumerable. The 'webkit'
  //    (lower case 'w') ones are, but they don't `deCamelCase()` into a prefix that we can detect.

  function iteration(property) {
    if(property.charAt(0) === '-') {
      properties.push(property)

      var parts = property.split('-'),
        prefix = parts[1]

      // Count prefix uses
      prefixCounters[prefix] = ++prefixCounters[prefix] || 1

      // This helps determining shorthands
      while(parts.length > 3) {
        parts.pop()

        var shorthand = parts.join('-')

        if (supportedProperty(shorthand)) {
          properties.push(shorthand)
        }
      }
    }
  }

  // Some browsers have numerical indices for the properties, some don't
  if(allStyles && allStyles.length > 0) {
    for(var i=0; i<allStyles.length; i++) {
      iteration(allStyles[i])
    }
  }
  else {
    for(var property in allStyles) {
      iteration(deCamelCase(property))
    }
  }

  var highest = 0
  for(var prefix in prefixCounters) {

    if(highest < prefixCounters[prefix]) {
      highest = prefixCounters[prefix]
      fixers.prefix = '-' + prefix + '-'
    }
  }
  fixers.Prefix = camelCase(fixers.prefix)
}
