var o = require('ospec')

var exposed = require('../test-utils/exposed')
var mocks = require('../test-utils/mocks')
var upToDate = require('../test-utils/misc').upToDate

var init = exposed.init
var finalize = exposed.finalize
var supportedProperty = exposed.supportedProperty
var blankFixers = exposed.blankFixers

var referenceFixers = Object.keys(blankFixers())


o.spec('supportedProperty', function() {
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
    o(upToDate(__dirname, '../src/detectors/utils.js')).equals(true)
  })

  o('works without options', function(){
    mocks(global)
    init()
    finalize()

    o(supportedProperty('foo')).equals(false)
  })
  o('works with empty options', function(){
    mocks(global, {})
    init()
    finalize()

    o(supportedProperty('foo')).equals(false)
  })
  o('detects simple property', function(){
    mocks(global, {properties: {foo: '0'}})
    init()
    finalize()

    o(supportedProperty('foo')).equals(true)
  })
  o('detects property with a dash', function(){
    mocks(global, {properties: {fooBar: '0'}})
    init()
    finalize()

    o(supportedProperty('foo-bar')).equals(true)
  })
  o('detects property with a prefix', function(){
    mocks(global, {properties: {FooBar: '0'}})
    init()
    finalize()

    o(supportedProperty('-foo-bar')).equals(true)
  })
})
