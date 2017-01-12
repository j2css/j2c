// Derived from Lea Verou's PrefixFree

var allStyles, styleAttr, styleElement, supportedProperty, supportedDecl

function init() {
  allStyles = getComputedStyle(document.documentElement, null)
  styleAttr = document.createElement('div').style
  styleElement = document.documentElement.appendChild(document.createElement('style'))
  supportedDecl = _supportedDecl
  supportedProperty = _supportedProperty
  if ('zIndex' in styleAttr && !('z-index' in styleAttr)) {
    // Some browsers like it dash-cased, some camelCased, most like both.
    supportedDecl = function(property, value) {return _supportedDecl(camelCase(property), value)}
    supportedProperty = function(property) {return _supportedProperty(camelCase(property))}
  }
}
function finalize() {
  if (typeof document !== 'undefined') document.documentElement.removeChild(styleElement)
  // `styleAttr` is used at run time via `supportedProperty()`
  // `allStyles` and `styleElement` can be displosed of after initialization.
  allStyles = styleElement = null
}
function cleanupDetectorUtils() {
  finalize()
  styleAttr = null
}
function hasCleanState() {
  return allStyles == null && styleAttr == null && styleElement == null
}
// Helpers, in alphabetic order

function camelCase(str) {
  return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase() }).replace('-','')
}
function deCamelCase(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() })
}
function _supportedDecl(property, value) {
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
function _supportedProperty(property) {
  return property in styleAttr
}
function supportedRule(selector) {
  styleElement.textContent = selector + '{}'
  return !!styleElement.sheet.cssRules.length
}

export {
  allStyles, styleAttr,
  init, finalize, cleanupDetectorUtils, hasCleanState,
  camelCase, deCamelCase,
  supportedDecl, supportedMedia, supportedProperty, supportedRule
}