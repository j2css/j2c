var o = require('ospec')

var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink
var mocks = require('../test-utils/mocks')
var upToDate = require('../test-utils/misc').upToDate

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin

var referenceFixers = Object.keys(blankFixers())



o.spec('plugin.decl for properties', function() {
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

  o('it leaves unknowned properties as is', function() {
    mocks(global, {properties: {'-o-foo': null, 'foo': null}})
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.decl('foo', 'bar')

    o(sink.buffer).deepEquals([['decl', 'foo', 'bar']])
    o(fixers.properties).deepEquals({'foo': 'foo'})
  })
  o('adds prefixes when necessary', function() {
    mocks(global, {properties: {'-o-foo': 'bar'}})
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({})

    methods.decl('foo', 'bar')
    methods.decl('baz', 'qux')

    o(sink.buffer).deepEquals([
        ['decl', '-o-foo', 'bar'],
        ['decl', 'baz', 'qux']
    ])

    o(fixers.properties).deepEquals({
      'foo': '-o-foo',
      'baz': 'baz'
    })
  })
  o('doesn\'t prefix when both prefix an unprefixed are supported', function() {
    mocks(global, {properties: {'-o-foo': 'bar', 'foo': 'bar'}})
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({})

    methods.decl('foo', 'bar')
    methods.decl('baz', 'qux')

    o(sink.buffer).deepEquals([
        ['decl', 'foo', 'bar'],
        ['decl', 'baz', 'qux']
    ])

    o(fixers.properties).deepEquals({
      'foo': 'foo',
      'baz': 'baz'
    })
  })
})