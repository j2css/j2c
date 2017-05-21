var o = require('../test-utils/ospec-instance')

var cleanupIfNeeded = require('../test-utils/misc').cleanupIfNeeded
var exposed = require('../test-utils/exposed')
var mocks = require('../test-utils/mocks')
var upToDate = require('../test-utils/misc').upToDate

var hasCleanState = exposed.hasCleanState
var init = exposed.init
var finalize = exposed.finalize
var detectWebkitCompat = exposed.detectWebkitCompat
var blankFixers = exposed.blankFixers

var referenceFixers = Object.keys(blankFixers())


o.spec('Webkit prefies for Web compat', function() {
  var fixers
  o.beforeEach(function() {
    o(hasCleanState()).equals(true)('detector utils state isn\'t clean')
    fixers = blankFixers()
  })
  o.afterEach(function() {
    cleanupIfNeeded(exposed)
    o(Object.keys(fixers)).deepEquals(referenceFixers)
    fixers = null
  })

  o('build up to date', function() {
    o(upToDate(__dirname, '../src/detectors/functions.js')).equals(true)
  })

  o('detects that `background-clip:text` needs a prefix', function(){
    mocks(global, {properties: {backgroundClip: ['padding-box', 'border-box', 'margin-box'], WebkitBackgroundClip: 'text'}})
    init()
    detectWebkitCompat(fixers)
    finalize()

    o(fixers.WkBCTxt).equals(true)
  })
  o('ignore `-webkit-background-clip:text` when the unprefixed version works', function(){
    mocks(global, {properties: {backgroundClip: ['padding-box', 'border-box', 'margin-box', 'text'], WebkitBackgroundClip: 'text'}})
    init()
    detectWebkitCompat(fixers)
    finalize()

    o(fixers.WkBCTxt).equals(false)
  })
  o('detect `-webkit-text-stroke`', function() {
    mocks(global, {properties: {WebkitTextStroke: 'thin red'}})
    init()
    detectWebkitCompat(fixers)
    finalize()

    o(fixers.properties['text-stroke']).equals('-webkit-text-stroke')
  })
  o('ignores `-webkit-text-stroke` if `text-stroke` is supported', function() {
    mocks(global, {properties: {WebkitTextStroke: 'thin red', textStroke: 'thin red'}})
    init()
    detectWebkitCompat(fixers)
    finalize()

    o(fixers.properties).deepEquals({})
  })
})