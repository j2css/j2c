var o = require('ospec')

var exposed = require('../test-utils/exposed')
var upToDate = require('../test-utils/misc').upToDate

var camelCase = exposed.camelCase
var deCamelCase = exposed.deCamelCase

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
})

