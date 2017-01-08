var o = require('ospec')

var exposed = require('../test-utils/exposed')
var makeSink = require('../test-utils/misc').makeSink

var blankFixers = exposed.blankFixers
var createPrefixPlugin = exposed.createPrefixPlugin

var referenceFixers = Object.keys(blankFixers())



o.spec('plugin.rule', function() {
  var fixers

  o.beforeEach(function() {
    fixers = blankFixers()
  })
  o.afterEach(function() {
    if (typeof global.cleanupMocks === 'function') global.cleanupMocks()
    o(Object.keys(fixers)).deepEquals(referenceFixers)
    fixers = null
  })

  o('it leaves unrelated selector as is', function() {
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.rule('.foo:active #baz[foo]')

    o(sink.buffer).deepEquals([['rule', '.foo:active #baz[foo]']])
  })
  o('it prefixes known selectors appropriately', function() {
    fixers.selectorList = [':any-link', '::selection', '::placeholder']
    fixers.selectorMap = {
      ':any-link': ':-o-any-link',
      '::selection': '::-o-selection',
      '::placeholder': ':-o-placeholder'
    }
    fixers.hasSelectors = true
    fixers.prefix = '-o-'

    var plugin = createPrefixPlugin().setFixers(fixers)
    var sink = makeSink()
    var methods = plugin().$filter(sink)

    methods.rule('.foo:active #baz[foo]')
    methods.rule('::placeholder .foo:any-link::selection:selection #baz[qux=":any-link"]/*::selection*/[quux=\'::selection\']')

    o(sink.buffer).deepEquals([
      ['rule', '.foo:active #baz[foo]'],
      ['rule', ':-o-placeholder .foo:-o-any-link::-o-selection:selection #baz[qux=":any-link"]/*::selection*/[quux=\'::selection\']']
    ])
  })
})