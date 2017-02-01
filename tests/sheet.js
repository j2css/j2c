var o = require('../test-utils/ospec-instance')

var J2c = require('../dist/j2c.commonjs')
var sink = require('../test-utils/sinks').simple

o.spec('sheets (new suite, WIP)', function() {
  var j2c
  o.beforeEach(function(){
    j2c = J2c({plugins: [sink]})
  })
  o.spec('selectors', function() {
    o('empty root selectors are rejected', function() {

      var css = j2c.sheet({p:{color:'red'},'':{color:'blue'}})

      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'color', 'red'],
        ['_rule'],
        ['err', "Invalid selector ''"]
      ])
    })
    o('empty sub-selectors are rejected', function() {

      var css = j2c.sheet({p:{'':{color: 'red'}}})

      o(css).deepEquals([['err', "Invalid selector ''"]])
    })
  })
})