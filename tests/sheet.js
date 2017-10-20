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
  o.spec('at-rules', function() {
    o('@keyframes', function() {
      var css = j2c.sheet({
        '@keyframes global(qux)': {
          from: {
            foo: 'bar'
          },
          to: {
            foo: 'baz'
          }
        }
      })
      o(css).deepEquals([
        ['atrule', '@keyframes', 'keyframes', 'qux', 'rule'],
          ['rule', 'from'],
            ['decl', 'foo', 'bar'],
          ['_rule'],
          ['rule', 'to'],
            ['decl', 'foo', 'baz'],
          ['_rule'],
        ['_atrule']
      ])
    })
  })
  o('anonymous @keyframes alone in a block', function() {
    var css = j2c.sheet({
      'p': {
        '@keyframes': {
          from: {
            foo: 'bar'
          },
          to: {
            foo: 'baz'
          }
        }
      }
    })
    var name = css[1][2]

    o(css).deepEquals([
      ['rule', 'p'],
        ['decl', 'animation-name', name],
      ['_rule'],
      ['atrule', '@keyframes', 'keyframes', name, 'rule'],
        ['rule', 'from'],
          ['decl', 'foo', 'bar'],
        ['_rule'],
        ['rule', 'to'],
          ['decl', 'foo', 'baz'],
        ['_rule'],
      ['_atrule']
    ])
  })
  o('anonymous @keyframes after another declaration', function() {
    var css = j2c.sheet({
      'p': {
        animationDuration: '1s',
        '@keyframes': {
          from: {
            foo: 'bar'
          },
          to: {
            foo: 'baz'
          }
        }
      }
    })
    var name = css[2][2]

    o(css).deepEquals([
      ['rule', 'p'],
        ['decl', 'animation-duration', '1s'],
        ['decl', 'animation-name', name],
      ['_rule'],
      ['atrule', '@keyframes', 'keyframes', name, 'rule'],
        ['rule', 'from'],
          ['decl', 'foo', 'bar'],
        ['_rule'],
        ['rule', 'to'],
          ['decl', 'foo', 'baz'],
        ['_rule'],
      ['_atrule']
    ])
  })
  o('anonymous @keyframes at the root errors out', function() {
    var css = j2c.sheet({
      '@keyframes': {
        from: {
          foo: 'bar'
        },
        to: {
          foo: 'baz'
        }
      }
    })

    o(css).deepEquals([
      ['err', 'Unexpected anonymous @keyframes out of selector']
    ])
  })
})