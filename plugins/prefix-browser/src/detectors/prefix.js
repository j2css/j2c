// Derived from Lea Verou's PrefixFree

import {
  allStyles,
  supportedRule,
  camelCase, deCamelCase
} from './core.js'

export function detectPrefix(fixers) {
  var prefixCounters = {}
  // Why are we doing this instead of iterating over properties in a .style object? Because Webkit.
  // 1. Older Webkit won't iterate over those.
  // 2. Recent Webkit will, but the 'Webkit'-prefixed properties are not enumerable. The 'webkit'
  //    (lower case 'w') ones are, but they don't `deCamelCase()` into a prefix that we can detect.

  function iteration(property) {
    if(property.charAt(0) === '-') {
      var prefix = property.split('-')[1]

      // Count prefix uses
      prefixCounters[prefix] = ++prefixCounters[prefix] || 1
    }
  }

  // Some browsers have numerical indices for the properties, some don't
  if(allStyles && allStyles.length > 0) {
    for(var i=0; i<allStyles.length; i++) {
      iteration(allStyles[i])
    }
  } else {
    for(var property in allStyles) {
      iteration(deCamelCase(property))
    }
  }

  var prefixes = []
  for (var p in prefixCounters) prefixes.push(p)
  prefixes.sort(function(a,b) {return prefixCounters[b] - prefixCounters[a]})

  fixers.prefixes = prefixes.map(function(p){return '-' + p + '-'})
  fixers.prefix = fixers.prefixes[0] || ''
  // Edge supports both `webkit` and `ms` prefixes, but `ms` isn't detected with the method above.
  // the selector comes from http://browserstrangeness.com/css_hacks.html
  if (supportedRule('_:-ms-lang(x), _:-webkit-full-screen')) fixers.prefixes.push('-ms-')
  fixers.Prefix = camelCase(fixers.prefix)
}
