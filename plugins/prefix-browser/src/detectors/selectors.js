// Derived from Lea Verou's PrefixFree

import {supportedRule} from './utils.js'

export function detectSelectors(fixers) {
  function prefixSelector(selector) {
    return selector.replace(/^::?/, function($0) { return $0 + fixers.prefix })
  }

  if (fixers.prefix === '') return
  var selectors = {
    ':read-only': 1,
    ':read-write': 1,
    ':any-link': 1,
    '::selection': 1
  }

  // builds an array of selectors that need a prefix.
  for(var selector in selectors) {
    if(!supportedRule(selector) && supportedRule(prefixSelector(selector))) {
      fixers.hasSelectors = true
      fixers.selectors.push(selector)
    }
  }
}