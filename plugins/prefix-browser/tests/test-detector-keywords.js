var o = require('ospec')

var exposed = require('../test-utils/exposed')
var mocks = require('../test-utils/mocks')
var upToDate = require('../test-utils/misc').upToDate

var blankFixers = exposed.blankFixers
var camelCase= exposed.camelCase
var deCamelCase= exposed.deCamelCase
var detectKeywords = exposed.detectKeywords
var finalize = exposed.finalize
var init = exposed.init

var referenceFixers = Object.keys(blankFixers())

// -----------------------------------
// define options and expected results

var noFlexSrc = {
  'color': ['initial'],
  'cursor': [ 'grab', 'grabbing', 'zoom-in', 'zoom-out'],
  'display' : ['grid', 'inline-grid'],
  'position': ['sticky'],
  'width, columnWidth, height, maxHeight, maxWidth, minHeight, minWidth': ['contain-floats', 'fill-available', 'fit-content', 'max-content', 'min-content']
}

var unprefixed = {}, prefixed = {}, both = {}, result = {}
var  properties = {noFlex: {}, flex: {}, box: {}, flexbox: {}}
var emptyResult = [
  'cursor', 'display', 'position', 'width', 'columnWidth', 'height',
  'maxHeight', 'maxWidth', 'minHeight', 'minWidth'
].reduce(function(acc, k){
  acc[deCamelCase(k)] = {}
  return acc
}, {})

unprefixed.noFlex = Object.keys(noFlexSrc).reduce(function(acc, kk){
  kk.split(', ').forEach(function(k) {
    acc[k] = noFlexSrc[kk]
  })
  return acc
}, {})
unprefixed.flex = {display:['flex', 'inline-flex']}
unprefixed.box = {display:['box']}
unprefixed.flexbox = {display:['flexbox', 'inline-flexbox']}

;['noFlex', 'flex', 'box', 'flexbox'].forEach(function(flexType) {
  prefixed[flexType] = Object.keys(unprefixed[flexType]).reduce(function(acc, k) {
    acc[k] = unprefixed[flexType][k].map(function(v) {return '-o-' + v})
    return acc
  }, {})

  both[flexType] = Object.keys(unprefixed[flexType]).reduce(function(acc, k) {
    acc[k] = unprefixed[flexType][k].concat(prefixed[flexType][k])
    return acc
  }, {})

  result[flexType] = Object.keys(emptyResult).reduce(function(acc, k) {
    if (k !== 'color' && camelCase(k) in unprefixed[flexType]) acc[k] = unprefixed[flexType][camelCase(k)].reduce(function(acc2, v){
      acc2[v] = '-o-' + v
      return acc2
    }, {})
    else acc[k] = {}
    return acc
  }, {})
})

var ieAltProps = {
  'align-content': '-ms-flex-line-pack',
  'align-items': '-ms-flex-align',
  'align-self': '-ms-flex-item-align',
  'flex-basis': '-ms-preferred-size',
  'flex-grow': '-ms-flex-positive',
  'flex-shrink': '-ms-flex-negative',
  'justify-content': '-ms-flex-pack',
  'order': '-ms-flex-order'
}
var ieAltValues = {
  // 'flex': 'flexbox',
  'flex-end': 'end',
  'flex-start': 'start',
  'inline-flex': 'inline-flexbox',
  'space-around': 'distribute',
  'space-between': 'justify'
}
Object.assign(properties.flexbox, ieAltProps)
Object.keys(ieAltProps).forEach(function(p) {
  result.flexbox[p] = ieAltValues
})
result.flexbox.display.flex = result.flexbox.display.flexbox

var oldAltProps = {
  'align-items': 'box-align',
  'flex': 'box-flex', // https://css-tricks.com/snippets/css/a-guide-to-flexbox/#comment-371025,
  'flex-wrap': 'box-lines',
  'justify-content': 'box-pack',
  'order': 'box-ordinal-group' // https://css-tricks.com/snippets/css/a-guide-to-flexbox/#comment-371025
}
var oldAltValues = {
  // 'flex': 'box',
  'flex-end': 'end',
  'flex-start': 'start',
  'inline-flex': 'inline-box',
  'space-around': 'justify',
  'space-between': 'justify',
  'wrap': 'multiple',
  'wrap-reverse': 'multiple'
}
Object.assign(
  properties.box,
  Object.keys(oldAltProps).reduce(function(acc, k){
    acc[k] = '-o-' + oldAltProps[k]
    return acc
  }, {})
)
Object.keys(oldAltProps).forEach(function(p) {
  result.box[p] = oldAltValues
})
result.box.display.flex = result.box.display.box


// -----------------------------------

o.spec('detectKeywords', function() {
  var fixers
  o.beforeEach(function() {
    fixers = blankFixers()
  })
  o.afterEach(function() {
    if (typeof global.cleanupMocks === 'function') global.cleanupMocks()
    o(Object.keys(fixers)).deepEquals(referenceFixers)
    fixers = null
  })

  o('build up to date', function() {

    o(upToDate(__dirname, '../src/detectors/keywords.js')).equals(true)
  })

  o('works when no prefix are supported', function(){
    mocks(global)
    init()
    detectKeywords(fixers)
    finalize()

    o(fixers.keywords).deepEquals({})
    o(fixers.initial).equals(null)
  })
  o('works with a prefix but no valid keyword', function(){
    mocks(global)
    init()
    fixers.prefix = '-o-'
    detectKeywords(fixers)
    finalize()

    o(fixers.keywords).deepEquals(emptyResult)
    o(fixers.initial).equals(null)
  })

  ;['noFlex', 'flex', 'box', 'flexbox'].forEach(function(flexType) {
    o('works with a prefix and unprefixed keywords (' + flexType + ')', function(){
      mocks(global, {properties: unprefixed[flexType]})
      init()
      fixers.prefix = '-o-'
      detectKeywords(fixers)
      finalize()

      o(fixers.keywords).deepEquals(emptyResult)
      o(fixers.initial).equals(null)
    })
    o('works with a prefix and prefixed keywords (' + flexType + ')', function(){
      mocks(global, {properties: prefixed[flexType]})
      init()
      fixers.prefix = '-o-'
      detectKeywords(fixers)
      finalize()
      o(fixers.keywords).deepEquals(result[flexType])
      o(fixers.initial).equals(flexType === 'noFlex' ? '-o-initial' : null)
    })

    o('works with a prefix and both prefixed and unprefixed keywords (' + flexType + ')', function(){
      mocks(global, {properties: both[flexType]})
      init()
      fixers.prefix = '-o-'
      detectKeywords(fixers)
      finalize()

      o(fixers.keywords).deepEquals(emptyResult)
      o(fixers.initial).equals(null)
    })
  })
})
