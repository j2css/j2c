// Derived from Lea Verou's PrefixFree

import {supportedRule} from './utils.js'

export function detectAtrules(fixers) {
  if (fixers.prefix === '') return
  var atrules = {
    'keyframes': 'name',
    'viewport': null,
    'document': 'regexp(".")'
  }
  for(var atrule in atrules) {
    var test = atrule + ' ' + (atrules[atrule] || '')

    if(!supportedRule('@' + test) && supportedRule('@' + self.prefix + test)) {
      fixers.fixAtrules = true
      fixers.atrules['@' + atrule] = fixers.prefix + atrule
    }
  }
}