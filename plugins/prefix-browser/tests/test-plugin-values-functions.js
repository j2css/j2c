var o = require('ospec')

var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink
var mocks = require('../test-utils/mocks')

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin

var referenceFixers = Object.keys(blankFixers())

o.spec('plugin.decl for values that have functions', function() {
  var fixers

  o.beforeEach(function() {
    fixers = blankFixers()
  })
  o.afterEach(function() {
    if (typeof global.cleanupMocks === 'function') global.cleanupMocks()
    o(Object.keys(fixers)).deepEquals(referenceFixers)
    fixers = null
  })

  o('leaves unknown functions alone', function() {
    fixers.functions = ['linear-gradient', 'repeating-linear-gradient', 'calc', 'element', 'cross-fade']
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.decl('foo', 'color(red a(0))')

    o(sink.buffer).deepEquals([['decl', 'foo', 'color(red a(0))']])
  })
  o('fixes known functions', function() {
    fixers.functions = ['linear-gradient', 'repeating-linear-gradient', 'calc', 'element', 'cross-fade']
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.decl('foo', 'cross-fade(linear-gradient(89deg red, green),repeating-linear-gradient(-20deg rgb( calc(2 * var(--foo)), 0, 0), green))')
    methods.decl('foo', 'linear-gradient(100deg red, green)')

    o(sink.buffer).deepEquals([
      ['decl', 'foo', '-o-cross-fade(-o-linear-gradient(1deg red, green),-o-repeating-linear-gradient(110deg rgb( -o-calc(2 * var(--foo)), 0, 0), green))'],
      ['decl', 'foo', '-o-linear-gradient(-10deg red, green)']
      ])
  })
  o('skips the gradient fixer if none are present (see coverage)', function() {
    fixers.functions = ['calc', 'element', 'cross-fade']
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.decl('foo', 'cross-fade(linear-gradient(89deg red, green),repeating-linear-gradient(-20deg rgb( calc(2 * var(--foo)), 0, 0), green))')
    methods.decl('foo', 'linear-gradient(100deg red, green)')

    o(sink.buffer).deepEquals([
      ['decl', 'foo', '-o-cross-fade(linear-gradient(89deg red, green),repeating-linear-gradient(-20deg rgb( -o-calc(2 * var(--foo)), 0, 0), green))'],
      ['decl', 'foo', 'linear-gradient(100deg red, green)']
      ])
  })
})


