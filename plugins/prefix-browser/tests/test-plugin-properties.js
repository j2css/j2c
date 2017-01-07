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
  o('with flexbox 2009, `flex-direction` becomes box-orient + box-direction', function() {
    mocks(global)
    fixers.prefix = '-o-'
    fixers.properties['box-orient'] = '-o-box-orient'
    fixers.properties['box-direction'] = '-o-box-direction'
    fixers.flexbox2009 = true

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({
      'box-orient': '-o-box-orient',
      'box-direction': '-o-box-direction'
    })

    methods.decl('flex-direction', 'column-reverse')

    o(sink.buffer).deepEquals([
        ['decl', '-o-box-orient', 'block-axis'],
        ['decl', '-o-box-direction', 'reverse']
    ])

    o(fixers.properties).deepEquals({
      'box-orient': '-o-box-orient',
      'box-direction': '-o-box-direction'
    })
  })
  o('with flexbox 2009, `flex-flow` becomes box-orient + box-direction + box-lines', function() {
    mocks(global)
    fixers.prefix = '-o-'
    fixers.properties['box-orient'] = '-o-box-orient'
    fixers.properties['box-direction'] = '-o-box-direction'
    fixers.properties['flex-wrap'] = '-o-box-lines'
    fixers.keywords['flex-wrap'] = {wrap:'multiple'}
    fixers.hasKeywords = true
    fixers.flexbox2009 = true

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({
      'box-orient': '-o-box-orient',
      'box-direction': '-o-box-direction',
      'flex-wrap': '-o-box-lines'
    })

    methods.decl('flex-flow', 'column-reverse  wrap')

    o(sink.buffer).deepEquals([
        ['decl', '-o-box-orient', 'block-axis'],
        ['decl', '-o-box-direction', 'reverse'],
        ['decl', '-o-box-lines', 'multiple']
    ])

    o(fixers.properties).deepEquals({
      'box-orient': '-o-box-orient',
      'box-direction': '-o-box-direction',
      'flex-wrap': '-o-box-lines'
    })
  })
  o('with flexbox 2012, `flex-flow` becomes flex-direction + flex-wrap', function() {
    mocks(global, {properties:{'-ms-flex-direction':'0', '-ms-flex-wrap':'0'}})
    fixers.prefix = '-ms-'
    fixers.hasKeywords = true
    fixers.flexbox2012 = true

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({})

    methods.decl('flex-flow', 'column-reverse  wrap')

    o(sink.buffer).deepEquals([
        ['decl', '-ms-flex-direction', 'column-reverse'],
        ['decl', '-ms-flex-wrap', 'wrap']
    ])

    o(fixers.properties).deepEquals({
      'flex-direction': '-ms-flex-direction',
      'flex-wrap': '-ms-flex-wrap'
    })
  })
  o('the properties fixer can be specified manually', function(){
    fixers.fixProperty = function() {return 'replaced'}

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    o(fixers.properties).deepEquals({})

    methods.decl('foo', 'bar')
    methods.decl('baz', 'qux')

    o(sink.buffer).deepEquals([
        ['decl', 'replaced', 'bar'],
        ['decl', 'replaced', 'qux']
    ])

    o(fixers.properties).deepEquals({})

  })
})