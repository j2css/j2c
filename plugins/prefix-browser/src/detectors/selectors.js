// Derived from Lea Verou's PrefixFree

import {supportedRule} from './core.js'

export function detectSelectors(fixers) {
  var selector, prefixed
  function prefixSelector(selector) {
    return selector.replace(/^::?/, function($0) { return $0 + fixers.prefix })
  }

  if (fixers.prefix === '') return
  var selectors = {
    ':any-link': ':any-link',
    ':read-only': ':read-only',
    ':read-write': ':read-write',
    '::selection': '::selection',

    ':fullscreen': ':fullscreen', //TODO sort out what changed between specs
    ':full-screen': ':fullscreen',
    '::backdrop': '::backdrop',

    //sigh
    ':placeholder': '::placeholder',
    '::placeholder': '::placeholder',
    ':input-placeholder': '::placeholder',
    '::input-placeholder': '::placeholder'
  }

  // builds an array of selectors that need a prefix.
  for (selector in selectors) {
    prefixed = prefixSelector(selector)
    if(!supportedRule(selectors[selector]) && supportedRule(prefixed)) {
      fixers.hasSelectors = true
      fixers.selectorList.push(selectors[selector])
      fixers.selectorMap[selectors[selector]] = prefixed
    }
  }
}