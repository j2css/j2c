// Derived from Lea Verou's PrefixFree

var allStyles, styleAttr, styleElement

function init() {
  allStyles = getComputedStyle(document.documentElement, null),
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
  styleElement[property] = ''
  styleElement[property] = value
  return !!styleElement[property]
}
function supportedProperty(property) {
  return camelCase(property) in styleAttr
}
function supportedRule(selector) {
  styleElement.textContent = selector + '{}'
  return !!styleElement.sheet.cssRules.length
}

export {
  allStyles, styleElement,
  init, finalize,
  camelCase, deCamelCase,
  supportedDecl, supportedProperty, supportedRule
}