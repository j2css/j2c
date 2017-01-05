var o = require('ospec')

var exposed = require('../test-utils/exposed')
var mocks = require('../test-utils/mocks')
var upToDate = require('../test-utils/misc').upToDate

var blankFixers = exposed.blankFixers
var camelCase = exposed.camelCase
var deCamelCase = exposed.deCamelCase

var referenceFixers = Object.keys(blankFixers())

o.spec('utils', function() {
  o('build up to date', function() {
    o(upToDate(__dirname, '../src/detectors/utils.js')).equals(true)
  })
  o.spec('camel case conversion', function() {

    o('camelCase', function() {
      o(camelCase('foo')).equals('foo')
      o(camelCase('f-oo')).equals('fOo')
      o(camelCase('-foo')).equals('Foo')
      o(camelCase('foo')).equals('foo')
      o(camelCase('f--oo')).equals('fOo')
    })
    o('deCamelCase', function() {
      o(deCamelCase('foo')).equals('foo')
      o(deCamelCase('fOo')).equals('f-oo')
      o(deCamelCase('Foo')).equals('-foo')
    })
  })
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
    o('dummy', function(){
      mocks(global)
    })

  })
})

