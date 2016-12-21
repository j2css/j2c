var fixers = {prefix: ''}

var root = document.documentElement
function camelCase(str) {
  return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase() }).replace('-','')
}
function deCamelCase(str) {
  return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() })
}
function prefixSelector(selector) {
  return selector.replace(/^::?/, function($0) { return $0 + fixers.prefix })
}
export {fixers, root, camelCase, deCamelCase, prefixSelector}