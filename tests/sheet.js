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

    o(typeof name).equals('string')
    o(name.length).equals(9)
    o(name.charAt(0)).equals('_')

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
        '@keyframes ': {
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

    o(typeof name).equals('string')
    o(name.length).equals(9)
    o(name.charAt(0)).equals('_')

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
  o.spec('Locals, Globals ', function() {
    o('a local class', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          foo: 5
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(css).deepEquals([
        ['rule', '.' + names.bit],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o("a local class in a doubly quoted string shouldn't be localized", function() {
      var names = j2c.names
      var css = j2c.sheet({
        '[foo=".bit"]': {
          foo: 5
        }
      })

      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['rule', '[foo=".bit"]'],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o("a local class in a singly quoted string shouldn't be localized", function() {
      var names = j2c.names
      var css = j2c.sheet({
        "[foo='.bit']": {
          foo: 5
        }
      })

      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['rule', "[foo='.bit']"],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o("a local class in a comment shouldn't be localized", function() {
      var names = j2c.names
      var css = j2c.sheet({
        'p/*.bit*/': {
          foo: 5
        }
      })

      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['rule', 'p/*.bit*/'],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o('Mixing strings and comments (regexp validation)', function() {
      var names = j2c.names
      var css = j2c.sheet({
        "/*'*/.bit/*'*/": {
          foo: 5
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(css).deepEquals([
        ['rule', "/*'*/." + names.bit + "/*'*/"],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o('two local classes', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          foo: 5
        },
        '.bat': {
          bar: 6
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals('bat' + j2c.suffix)
      o(css).deepEquals([
        ['rule', '.' + names.bit],
          ['decl', 'foo', 5],
        ['_rule'],
        ['rule', '.' + names.bat],
          ['decl', 'bar', 6],
        ['_rule']
      ])
    })

    o('a local and a global class', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          foo: 5
        },
        ':global(.bat)': {
          bar: 6
        }
      })
      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals(undefined)

      o(css).deepEquals([
        ['rule', '.' + names.bit],
          ['decl', 'foo', 5],
        ['_rule'],
        ['rule', '.bat'],
          ['decl', 'bar', 6],
        ['_rule']
      ])
    })

    o('a local wrapping a global block', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          '@global': {
            '.bat': {
              foo: 5
            }
          }
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals(undefined)
      o(css).deepEquals([
        ['rule', '.' + names.bit + '.bat'],
          ['decl', 'foo', 5],
        ['_rule']
      ])
    })

    o('two local classes, nested', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          foo: 5,
          '.bat': {
            bar: 6
          }
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals('bat' + j2c.suffix)
      o(css).deepEquals([
        ['rule', '.' + names.bit],
          ['decl', 'foo', 5],
        ['_rule'],
        ['rule', '.' + names.bit + '.' + names.bat],
          ['decl', 'bar', 6],
        ['_rule']
      ])
    })

    o('@keyframes', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@keyframes bit': {}
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(css).deepEquals([
        ['atrule', '@keyframes', 'keyframes', names.bit, 'rule'],
        ['_atrule']
      ])
    })

    o('@keyframes with a CSS variable as name', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@keyframes var(--foo)': {}
      })

      o(names.hasOwnProperty('var')).equals(false)
      o(css).deepEquals([
        ['atrule', '@keyframes', 'keyframes', 'var(--foo)', 'rule'],
        ['_atrule']
      ])
    })

    o('a global @keyframes', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@keyframes global(bit)': {}
      })

      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['atrule', '@keyframes', 'keyframes', 'bit', 'rule'],
        ['_atrule']
      ])
    })

    o('a @keyframes nested in a @global at-rule', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@global': {
          '@keyframes bat': {
            'from': {
              foo: 6
            }
          }
        }
      })

      o(names.bat).equals(undefined)
      o(css).deepEquals([
        ['atrule', '@keyframes', 'keyframes', 'bat', 'rule'],
          ['rule', 'from'],
            ['decl', 'foo', 6],
          ['_rule'],
        ['_atrule']
      ])
    })

    o('one animation', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animation: 'bit 1sec'
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', names.bit + ' 1sec'],
        ['_rule']
      ])
    })

    o('a global animation', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animation: 'global(bit) 1sec'
        }
      })

      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', 'bit' + ' 1sec'],
        ['_rule']
      ])
    })

    o('an animation nested in a @global at-rule', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@global': {
          p: {
            animation: 'bit 1sec'
          }
        }
      })
      o(names.bit).equals(undefined)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', 'bit 1sec'],
        ['_rule']
      ])
    })

    o('one animation with a CSS variable', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animation: 'var(--foo) 1sec'
        }
      })

      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.hasOwnProperty('sec')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', 'var(--foo) 1sec'],
        ['_rule']
      ])
    })

    o('a complex animation list ', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animation: 'var(--foo, but) 1sec, bit 2sec, global(bat) 3sec'
        }
      })

      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.hasOwnProperty('sec')).equals(false)
      o(names.bit).equals('bit' + j2c.suffix)
      o(names.but).equals('but' + j2c.suffix)
      o(names.hasOwnProperty('bat')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', 'var(--foo,' + names.but + ') 1sec,' + names.bit + ' 2sec,bat 3sec'],
        ['_rule']
      ])
    })

    o('one animation without a name', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animation: '1sec step(0, end), 2sec step(3, start)'
        }
      })
      o(names.hasOwnProperty('ease')).equals(false)
      o(names.hasOwnProperty('step')).equals(false)
      o(names.hasOwnProperty('end')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation', '1sec step(4, end), 2sec step(3, start)'],
        ['_rule']
      ])
    })

    o('one animation-name', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'bit'
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', names.bit],
        ['_rule']
      ])
    })

    o('two animation-name', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'bit, bat'
        }
      })

      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals('bat' + j2c.suffix)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', names.bit + ',' + names.bat],
        ['_rule']
      ])
    })

    o('two animation-name, one global', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'bit, global(bat)'
        }
      })
      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals(undefined)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', names.bit + ',bat'],
        ['_rule']
      ])
    })

    o('one animation-name with a CSS variable', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'var(--foo)'
        }
      })
      o(names.hasOwnProperty('var')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', 'var(--foo)'],
        ['_rule']
      ])
    })

    o('one animation-name with a CSS variable that has a local fallback', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'var(--foo, bar)'
        }
      })
      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.bar).equals('bar' + j2c.suffix)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', 'var(--foo,' + names.bar + ')'],
        ['_rule']
      ])
    })

    o('one animation-name with nested CSS variables that have a local fallback', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'var(--foo, var(--bar, bar))'
        }
      })
      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.bar).equals('bar' + j2c.suffix)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', 'var(--foo,var(--bar,' + names.bar + '))'],
        ['_rule']
      ])
    })

    o('one animation-name with a CSS variable that has a global fallback', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'var(--foo, global(bar))'
        }
      })
      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.hasOwnProperty('bar')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', 'var(--foo,bar)'],
        ['_rule']
      ])
    })

    o('one animation-name with nested CSS variables that have a global fallback', function() {
      var names = j2c.names
      var css = j2c.sheet({
        p: {
          animationName: 'var(--foo, var(--bar, global(bar)))'
        }
      })
      o(names.hasOwnProperty('var')).equals(false)
      o(names.hasOwnProperty('foo')).equals(false)
      o(names.hasOwnProperty('bar')).equals(false)
      o(css).deepEquals([
        ['rule', 'p'],
          ['decl', 'animation-name', 'var(--foo,var(--bar,bar))'],
        ['_rule']
      ])
    })
    o('a nested @global at-rule', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '.bit': {
          '@global': {
            '.bat': {
              'foo': 6
            }
          }
        }
      })
      o(names.bit).equals('bit' + j2c.suffix)
      o(names.bat).equals(undefined)
      o(css).deepEquals([
        ['rule', '.' + names.bit + '.bat'],
          ['decl', 'foo', 6],
        ['_rule']
      ])
    })

    o('a @local rule nested in a @global block', function() {
      var names = j2c.names
      var css = j2c.sheet({
        '@global': {
          '.bit': {
            '@local': {
              ':global(.bat)': {
                foo: 6
              },
              '.but': {
                bar: 7
              }
            }
          }
        }
      })

      o(names.hasOwnProperty('bit')).equals(false)
      o(names.hasOwnProperty('bat')).equals(false)
      o(names.but).equals('but' + j2c.suffix)
      o(css).deepEquals([
        ['rule', '.bit.bat'],
          ['decl', 'foo', 6],
        ['_rule'],
        ['rule', '.bit.' + names.but],
          ['decl', 'bar', 7],
        ['_rule']
      ])
    })
  })
})
