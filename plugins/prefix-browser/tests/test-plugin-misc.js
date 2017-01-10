var o = require('../test-utils/ospec-instance')

var upToDate = require('../test-utils/misc').upToDate

o.spec('plugin misc tests', function() {
  o('build up to date', function() {
    o(upToDate(__dirname, '../src/plugin.js')).equals(true)
    o(upToDate(__dirname, '../src/fixers.js')).equals(true)
    o(upToDate(__dirname, '../src/main.js')).equals(true)
  })
})