var o = require('../test-utils/ospec-instance')

var J2c = require('../dist/j2c.commonjs')
var sink = require('../test-utils/sinks').simple

o.spec('Options and plugins', function(){
  o('string suffix', function(){
    var j2c = new J2c({suffix: '_suf', plugins:[sink]})

    o(j2c.suffix).equals('_suf')

    var css = j2c.sheet({
      '@keyframes foo': {
        'from, to': {width: 0}
      },
      '.bar' :{
        animation: 'baz 1sec',
        animationName: 'qux'
      }
    })

    o(css).deepEquals([
      ['atrule', '@keyframes', 'keyframes', 'foo_suf', 'rule'],
        ['rule', 'from, to'],
          ['decl', 'width', 0],
        ['_rule'],
      ['_atrule'],
      ['rule', '.bar_suf'],
        ['decl', 'animation', 'baz_suf 1sec'],
        ['decl', 'animation-name', 'qux_suf'],
      ['_rule']
    ])
    o(j2c.names).deepEquals({
      foo: 'foo_suf',
      bar: 'bar_suf',
      baz: 'baz_suf',
      qux: 'qux_suf'
    })
  })

  o('number suffix', function(){
    var j2c = new J2c({suffix: 4, plugins:[sink]})
    var suf = j2c.suffix

    o(suf.length).equals(5)

    var css = j2c.sheet({
      '@keyframes foo': {
        'from, to': {width: 0}
      },
      '.bar' :{
        animation: 'baz 1sec',
        animationName: 'qux'
      }
    })

    o(css).deepEquals([
      ['atrule', '@keyframes', 'keyframes', 'foo' + suf, 'rule'],
        ['rule', 'from, to'],
          ['decl', 'width', 0],
        ['_rule'],
      ['_atrule'],
      ['rule', '.bar' + suf],
        ['decl', 'animation', 'baz' + suf + ' 1sec'],
        ['decl', 'animation-name', 'qux' + suf],
      ['_rule']
    ])
    o(j2c.names).deepEquals({
      foo: 'foo' + suf,
      bar: 'bar' + suf,
      baz: 'baz' + suf,
      qux: 'qux' + suf
    })
  })

  o('honours the options.plugins field', function(){
    var buf = []
    function plugin(name) {
      return {filter: function (next) {
        return {init: function(){
          buf.push(name)
          return next.init()
        }}
      }}
    }
    var j2c = new J2c({plugins: [plugin('foo'), plugin('bar')]})

    o(j2c.sheet('')).equals('\n')
    o(buf).deepEquals(['foo', 'bar'])
  })

  o('a plugin that mutates `j2c`', function(){
    function plugin(j2c) {
      j2c.method = function(){return 5}
    }
    var j2c = new J2c({plugins: [plugin]})

    o(typeof j2c.method).equals('function')
    o(j2c.method()).equals(5)
  })

  o('absorb another instance (integration)', function() {
    var j2c1 = new J2c({plugins: [sink]})
    var j2c2 = new J2c(j2c1)

    o(j2c1.suffix).equals(j2c2.suffix)
    o(j2c1.names).equals(j2c2.names)
    o(
      j2c1.sheet({'.foo': {color: 'red'}})
    ).deepEquals(
      j2c2.sheet({'.foo': {color: 'red'}})
    )
    o(
      j2c1.sheet({'.foo': {color: 'red'}})
    ).deepEquals([
      ['rule', '.foo'+j2c1.suffix],
        ['decl', 'color', 'red'],
      ['_rule']
    ])
  })
})