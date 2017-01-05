// Derived from Lea Verou's PrefixFree

var allStyles, styleAttr, styleElement

function init() {
  allStyles = getComputedStyle(document.documentElement, null)
  styleAttr = document.createElement('div').style
  styleElement = document.documentElement.appendChild(document.createElement('style'))
}
function finalize() {
  document.documentElement.removeChild(styleElement)
  allStyles = styleAttr = styleElement = null
}

// Helpers, in alphabetic order

function camelCase(str) {
  return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase() }).replace('-','')
}
function deCamelCase(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() })
}
function supportedDecl(property, value) {
  styleAttr[property] = ''
  styleAttr[property] = value
  return !!styleAttr[property]
}
function supportedMedia(condition) {
  styleElement.textContent = '@media (' + condition +'){}'
  // Opera 11 treats unknown conditions as 'all', the rest as 'not all'.
  // So far tested in modern browsers (01/01/2017), and desktop IE9, FF4,
  // Opera 11/12, and Safari 6. TY SauceLabs.
  return !/^@media(?:\s+not)?\s+all/.test(styleElement.sheet.cssRules[0].cssText)
}
function supportedProperty(property) {
  // Some browsers like it dash-cased, some camelCased, most like both.
  return property in styleAttr || camelCase(property) in styleAttr
}
function supportedRule(selector) {
  styleElement.textContent = selector + '{}'
  return !!styleElement.sheet.cssRules.length
}

export {
  allStyles, styleAttr,
  init, finalize,
  camelCase, deCamelCase,
  supportedDecl, supportedMedia, supportedProperty, supportedRule
}