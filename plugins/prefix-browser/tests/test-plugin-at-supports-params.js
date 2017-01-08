var o = require('ospec')

var cleanupIfNeeded = require('../test-utils/misc').cleanupIfNeeded
var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink
var mocks = require('../test-utils/mocks')

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin
var hasCleanState = exposed.hasCleanState
var init = exposed.init
var finalize = exposed.finalize

var referenceFixers = Object.keys(blankFixers())



o.spec('plugin @supports parameters', function() {
  var fixers

  o.beforeEach(function() {
    o(hasCleanState()).equals(true)('detector utils state isn\'t clean')
    fixers = blankFixers()
  })
  o.afterEach(function() {
    cleanupIfNeeded(exposed)
    o(Object.keys(fixers)).deepEquals(referenceFixers)
  })

  o('works with a blank fixer object', function() {
    mocks(global)
    init()
    finalize()
    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.atrule('@supports', 'supports', '(foo:bar)', true)

    o(sink.buffer).deepEquals([['atrule', '@supports', 'supports', '(foo:bar)', true]])
  })
})