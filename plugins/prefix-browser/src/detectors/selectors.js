// Derived from Lea Verou's PrefixFree

import {supportedRule} from './utils.js'

export function detectSelectors(fixers) {
  var selector, prefixed
  function prefixSelector(selector) {
    return selector.replace(/^::?/, function($0) { return $0 + fixers.prefix })
  }

  if (fixers.prefix === '') return
  var selectors = {
    ':any-link': 1,
    ':read-only': 1,
    ':read-write': 1,
    '::selection': 1
  }

  // builds an array of selectors that need a prefix.
  for (selector in selectors) {
    if(!supportedRule(selector) && supportedRule(prefixSelector(selector))) {
      fixers.hasSelectors = true
      fixers.selectors.push(selector)
    }
  }
  // sigh
  var placeholders = {
    ':placeholder': 1,
    '::placeholder': 1,
    ':input-placeholder': 1,
    '::input-placeholder': 1
  }
  for (var selector in placeholders) {
    prefixed = prefixSelector(selector)
    if(!supportedRule(selector) && supportedRule(prefixed)) {
      fixers.hasSelectors = true
      fixers.selectors.push('::placeholder')      
      fixers.placeholder = prefixed
    }
  }
}