var o = require('ospec')

var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin

var referenceFixers = Object.keys(blankFixers())



o.spec('plugin @supports parameters', function() {
  var fixers

  o.beforeEach(function() {
    fixers = blankFixers()
  })
  o.afterEach(function() {
    o(Object.keys(fixers)).deepEquals(referenceFixers)
  })

  o('works with a blank fixer object', function() {
    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.atrule('@supports', 'supports', '(foo:bar)', true)

    o(sink.buffer).deepEquals([['atrule', '@supports', 'supports', '(foo:bar)', true]])
  })
})