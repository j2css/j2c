var o = require('ospec')

var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink
var upToDate = require('../test-utils/misc').upToDate

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin

var referenceFixers = Object.keys(blankFixers())



o.spec('plugin.atrules', function() {
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
    o(upToDate(__dirname, '../src/plugin.js')).equals(true)
    o(upToDate(__dirname, '../src/fixers.js')).equals(true)
    o(upToDate(__dirname, '../src/main.js')).equals(true)
  })

  o('works with a blank fixer object', function() {
    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.atrule('@keyframes', 'keyframes', 'foo', true)

    o(sink.buffer).deepEquals([['atrule', '@keyframes', 'keyframes', 'foo', true]])
  })
  o('with a prefix and hasAtrules set to true, leaves unknowed rules alone', function() {
    fixers.prefix = '-o-'
    fixers.hasAtrules = true

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.atrule('@keyframes', 'keyframes', 'foo', true)

    o(sink.buffer).deepEquals([['atrule', '@keyframes', 'keyframes', 'foo', true]])
  })
  o('modifies known rules according to fixers.atrules', function() {
    fixers.atrules['@foo'] = '@-o-foo'
    fixers.prefix = '-o-'
    fixers.hasAtrules = true

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.atrule('@foo', 'foo', 'bar', true)

    o(sink.buffer).deepEquals([['atrule', '@-o-foo', 'foo', 'bar', true]])
  })
})