var o = require('../test-utils/ospec-instance')

var J2c = require('../dist/j2c.commonjs')
var sink = require('../test-utils/sinks').simple

o.spec('namespaces', function (){
  o('named namespace', function(){
    var j2c = J2c({plugins: [sink]})
    var other = j2c.ns('other')
    var otherRes = other.inline({animationName: 'foo'})

    o(other.prefix).equals('other__')

    o(other.names.foo).equals('other__foo')

    o(otherRes).deepEquals([['decl', 'animation-name', other.names.foo]])
  })
  o('anonymous namespace of default length', function(){
    var j2c = J2c({plugins: [sink]})
    var other = j2c.ns()
    var otherRes = other.inline({animationName: 'foo'})

    o(other.prefix.length).equals(10)

    o(other.names.foo).equals(other.prefix + 'foo')

    o(otherRes).deepEquals([['decl', 'animation-name', other.names.foo]])
  })
  o('anonymous namespace of custom length', function(){
    var j2c = J2c({prefix: 3, plugins: [sink]})
    var other = j2c.ns()
    var otherRes = other.inline({animationName: 'foo'})

    o(other.prefix.length).equals(6)

    o(other.names.foo).equals(other.prefix + 'foo')

    o(otherRes).deepEquals([['decl', 'animation-name', other.names.foo]])
  })
  o('namespaced instances inherit plugin.set properties', function() {
    var plugin = {set: {foo: 'bar'}}

    var j2c = J2c({plugins: [plugin, sink]})
    var other = j2c.ns('other')

    o(j2c.hasOwnProperty('foo')).equals(true)
    o(other.hasOwnProperty('foo')).equals(true)

    o(j2c.foo).equals('bar')
    o(other.foo).equals('bar')
  })
  o('namespaces are cached', function() {
    var j2c = J2c({plugins: [sink]})
    var other = j2c.ns('other')
    var other2 = j2c.ns('other')

    o(other).equals(other2)
    o(other.names).equals(other2.names)

  })
})