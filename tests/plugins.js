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

  o('plugin.set adds fields to the instance', function(){
    var plugin = {set: {method: function(){return 5}}}

    var j2c = new J2c({plugins: [plugin]})

    o(typeof j2c.method).equals('function')
    o(j2c.method()).equals(5)
  })

  o('plugin.set the last plugin wins, but default methods and properties are preserved', function(){
    var plugin1 = {set: {foo: 5}}
    var plugin2 = {set: {foo: 6, names :7, sheet: 8}}

    var j2c = new J2c({plugins: [plugin1, plugin2]})

    o(j2c.foo).equals(6)
    o(j2c.names).notEquals(7)
    o(j2c.sheet).notEquals(8)
  })

  o('non-object plugins throw', function(){
    var threw = false
    try{
      J2c({plugins: [null]})
    } catch (e){
      threw = true
    }
    o(threw).equals(true)
  })

  o('empty plugins are tolerated', function(){
    var threw = false
    try{
      new J2c({plugins: []})
      new J2c({plugins: [[]]})
    } catch (e){
      threw = true
    }
    o(threw).equals(false)
  })

  o('catches errors while parsing (throw a String)', function(){
    var plugin = {filter: function(){
      return {decl: function(){
        throw 'foo'
      }}
    }}
    var j2c = J2c({plugins:[plugin, sink]})
    var res = j2c.sheet({p:{color: 'red'}})
    o(res).deepEquals([
      ['rule', 'p'],
        ['err', 'foo'],
      ['_rule']
    ])
  })

  o('catches errors while parsing (throw an Error)', function(){
    var plugin = {filter: function(){
      return {decl: function(){
        throw new Error('foo')
      }}
    }}
    var j2c = J2c({plugins:[plugin, sink]})
    var res = j2c.sheet({p:{color: 'red'}})
    o(res[0]).deepEquals(['rule', 'p'])
    o(res[1][0]).equals('err')
    o(res[1][1].indexOf('Error')).notEquals(-1)
    o(res[1][1].indexOf('foo')).notEquals(-1)
    o(res[2]).deepEquals(['_rule'])
  })

  o.spec('atrule plugins', function() {
    o('one atrule plugin', function() {
      var plugin = {
        atrule: function(next) {
          o(typeof next).equals('function')
          return function(walker, emit, match, v, prefix, local, depth) {
            o(match instanceof Array).equals(true)('value should have been a Array')
            o(walker instanceof Object).equals(true)('value should have been a Object')
            o(walker.hasOwnProperty('atrules')).equals(true)
            o(walker.hasOwnProperty('localize')).equals(true)
            o(walker.hasOwnProperty('localizeReplacer')).equals(true)
            o(walker.hasOwnProperty('names')).equals(true)

            o(emit instanceof Object).equals(true)('value should have been a Object')
            o(emit.hasOwnProperty('atrule')).equals(true)

            o(typeof prefix).equals('string')('value should have been a string')
              // `local` can be many things, the only things that matters is its truthiness
            o(!!local).equals(true)
              // `inAtRule` can be many things, the only things that matters is its truthiness
            o(depth).equals(0)

            if (match[2] === 'foo') emit.atrule(match[1], match[2], v, false)
            else next(walker, emit, match, v, prefix, local, depth)
          }
        }
      }

      var _j2c = J2c({plugins: [plugin, sink]})
      o(_j2c.sheet({'@foo': 'param'})).deepEquals([
        ['atrule', '@foo', 'foo', 'param', false]
      ])

      o(_j2c.sheet({
        '@foo': 'param2',
        '@bar': 'param',
        '@baz': 'param'
      })).deepEquals([
        ['atrule', '@foo', 'foo', 'param2', false],
        ['err', 'Unsupported at-rule: @bar'],
        ['err', 'Unsupported at-rule: @baz']
      ])

    })

    o('two atrule plugins', function() {
      function plugin(name) {
        return {
          atrule: function(next) {
            o(typeof next).equals('function')
            return function(walker, emit, match, v, prefix, local, depth) {
              if (match[2] === name) return emit.atrule(match[1], match[2], v, false)
              else next(walker, emit, match, v, prefix, local, depth)
            }
          }
        }
      }
      var _j2c = J2c({plugins: [plugin('foo'), plugin('bar'), sink]})
      o(_j2c.sheet({
        '@foo': 'param',
        '@bar': 'param'
      })).deepEquals([
        ['atrule', '@foo', 'foo', 'param', false],
        ['atrule', '@bar', 'bar', 'param', false]
      ])
      o(_j2c.sheet({
        '@foo': 'param2',
        '@bar': 'param3',
        '@baz': 'param'
      })).deepEquals([
        ['atrule', '@foo', 'foo', 'param2', false],
        ['atrule', '@bar', 'bar', 'param3', false],
        ['err', 'Unsupported at-rule: @baz']
      ])
    })

    o('atrule plugin has precedence over default at-rules', function() {
      var plugin = {
        atrule: function(next) {
          o(typeof next).equals('function')
          return function(walker, emit, match, v, prefix, local, depth) {
            if (match[2] === 'import') emit.atrule('@intercepted', 'intercepted', v, false)
            else next(walker, emit, match, v, prefix, local, depth)
          }
        }
      }

      o(J2c({plugins: [plugin, sink]}).sheet({'@import': 'foo'})).deepEquals([
        ['atrule', '@intercepted', 'intercepted', 'foo', false]
      ])
    })

    o('atrule plugin that verifies malformed rules are properly passed unparsed', function() {
      var plugin = {
        atrule: function (next) {
          o(typeof next).equals('function')
          return function(walker, emit, match, v) {

            o(match[0]).equals('@; hey')
            o(match[1]).equals('@')
            o(match[2]).equals('')
            o(match[3]).equals('')
            o(v).equals('foo')
            // no need to call next
          }
        }
      }

      o(J2c({plugins: [plugin, sink]}).sheet({
        '@; hey': 'foo'
      })).deepEquals([])
    })
  })
})
