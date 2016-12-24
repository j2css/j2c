/*eslint-env node*/

// ensure that we are not sensitive to additions to Object.prototype.
Object.prototype.BADBAD = 5

// used to normalize styles for reliable comparison.
var o = require('ospec'),
  minifySelectors = require('postcss-minify-selectors'),
  minifyParams = require('postcss-minify-params'),
  perfectionist = require('perfectionist'),
  postcss = require('postcss')([perfectionist({
    format: 'compressed'
  }), minifySelectors(), minifyParams()])

function normalize(s) {
  return postcss.process(s).css
}

function check(result, expected) {
  result = normalize(result)
  equals(normalize(expected), result)
}

function doesnt_have_key(dict, key) {
  o(dict.hasOwnProperty(key)).equals(false)
}

function has_key(dict, key) {
  o(dict.hasOwnProperty(key)).equals(true)
}

function contains(haystack, needle) {
  o(haystack.indexOf(needle)).notEquals(-1)
}

function equals(a, b) {
  o(a).equals(b)
}

function differs(a, b) {
  o(a).notEquals(b)
}

function has_type(a, b) {
  if (b === '' + b) {
    o(typeof a).equals(b)
  } else {
    o(a instanceof b).equals(true)
  }
}

function randStr() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
}

function randInt() {
  return Math.random().toString().substr(2, 3)
}

[
  // '../dist/j2c.commonjs.min',
  '../dist/j2c.commonjs'
  // ,
  // '../dist/inline/j2c.commonjs',
  // '../dist/inline/j2c.commonjs.min'
].forEach(function(lib) {
  var J2C = require(lib)
  ;[
    function() {
      Object.keys(J2C.names).forEach(function(k) {
        delete J2C.names[k]
      })
      return J2C
    },
    function() {
      return J2C()
    }
  ].forEach(function(j2c) {

    function checkinline(result, expected) {
      result = 'p{' + j2c().inline(result) + '}'
      expected = (expected instanceof Array ? expected : [expected]).map(function(s) {
        return 'p{' + s + '}'
      })
      check(result, expected)
    }


    o.spec('Inline', function() {
      o.spec('Basic', function() {
        o('a single property', function() {
          checkinline(
            {
              foo: 'bar'
            },
            'foo:bar;'
          )
        })

        o('two properties, ensure order', function() {
          checkinline(
            {
              foo: 'bar',
              baz: 'qux'
            },
            'foo:bar; baz:qux;'
          )
        })

        o('array of values', function() {
          checkinline(
            {
              foo: ['bar', 'baz']
            },
            'foo:bar; foo:baz;'
          )
        })

        o('one sub-property', function() {
          checkinline(
            {
              foo: {
                bar: 'baz'
              }
            },
            'foo-bar: baz;'
          )
        })

        o('two declrations at the top level', function() {
          checkinline(
            {
              foo: 'qux',
              baz: 'qux'
            },
            'foo:qux;baz:qux;'
          )
        })

        o('two sub-properties', function() {
          checkinline(
            {
              foo: {
                bar: 'baz',
                qux: 'baz'
              }
            },
            'foo-bar:baz; foo-qux:baz;'
          )
        })

        o('two sub-properties with a sub-sub-property', function() {
          checkinline(
            {
              foo: {
                bar: {
                  qux: 'quux'
                },
                baz: {
                  qix: 'qiix'
                }
              }
            },
            'foo-bar-qux:quux; foo-baz-qix:qiix;'
          )
        })

        o('$ operator in sub-property and sub-sub-property', function() {
          checkinline(
            {
              foo: {
                bar: {
                  qux: 'fred',
                  quux: 'frod'
                },
                baz: {
                  qix: 'frad',
                  qiix: 'frud'
                }
              }
            },
            'foo-bar-qux:fred; foo-bar-quux:frod; foo-baz-qix:frad; foo-baz-qiix:frud;'
          )
        })

        o('$ operator at the top level', function() {
          checkinline(
            {
              foo$baz: 'qux'
            },
            'foo:qux;baz:qux;'
          )
        })

        o('$ operator in sub-properties', function() {
          checkinline(
            {
              foo: {
                bar$qux: 'baz'
              }
            },
            'foo-bar:baz; foo-qux:baz;'
          )
        })

        o('$ operator in a sub-property with a sub-sub-property', function() {
          checkinline(
            {
              foo: {
                bar$baz: {
                  qux: 'quux'
                }
              }
            },
            'foo-bar-qux:quux; foo-baz-qux:quux;'
          )
        })

        o('$ operator in sub-property and sub-sub-property', function() {
          checkinline(
            {
              foo: {
                bar$baz: {
                  qux$quux: 'fred'
                }
              }
            },
            'foo-bar-qux:fred; foo-bar-quux:fred; foo-baz-qux:fred; foo-baz-quux:fred;'
          )
        })

        o('convert underscores', function() {
          checkinline(
            {
              'f_o_o': 'bar'
            },
            'f-o-o:bar;'
          )
        })

        o('convert CamelCase', function() {
          checkinline(
            {
              'FoO': 'bar'
            },
            '-fo-o:bar;'
          )
        })

        o('String value', function() {
          checkinline(
            'foo:bar',
            'foo:bar;'
          )
        })

        o('Array of Strings values', function() {
          checkinline(
            ['foo:bar', 'foo:baz'],
            'foo:bar;foo:baz'
          )
        })

        o('Array of mixed values at the root', function() {
          checkinline(
            ['foo:bar', {
              foo: 'baz'
            }],
            'foo:bar;foo:baz'
          )
        })

        o('Array of mixed value and sub-property', function() {
          checkinline(
            {
              foo: ['bar', {
                baz: 'qux'
              }]
            },
            'foo:bar;foo-baz:qux'
          )
        })

        o('Prefixes by hand', function() {
          checkinline(
            {
              _o$_p$: {
                foo: 'bar'
              }
            },
            '-o-foo:bar;-p-foo:bar;foo:bar;'
          )
        })

        o('CSS *Hack', function() {
          // tested manually because the crass normalization
          // outputs an empty string.
          checkinline(
            {
              '*foo': 'bar'
            },
            '*foo:bar;'
          )
        })

        o('CSS _Hack', function() {
          checkinline(
            ['_foo:bar', {
              _baz: 'qux'
            }],
            '_foo:bar;-baz:qux;'
          )
        })

        o('custom obj.valueOf', function() {
          var bar = {
            valueOf: function() {
              return 'theBAR'
            }
          }
          checkinline(
            {
              foo: bar
            },
            'foo:theBAR;'
          )
        })
      })

      o.spec('Nulls', function() {
        o('null value', function() {
          checkinline(
            null,
            ''
          )
        })

        o('null leafs', function() {
          checkinline(
            {
              foo: null
            },
            ''
          )
        })

        o('undefined leafs', function() {
          checkinline(
            {
              foo: void 8
            },
            ''
          )
        })

        o('null leafs in array', function() {
          checkinline(
            {
              foo: [null]
            },
            ''
          )
        })

        o('undefined leafs in array', function() {
          checkinline(
            {
              foo: [void 8]
            },
            ''
          )
        })

        o('null leafs in array, preceded by value', function() {
          checkinline(
            {
              foo: ['bar', null]
            },
            'foo:bar;'
          )
        })

        o('undefined leafs in array, preceded by value', function() {
          checkinline(
            {
              foo: ['bar', void 8]
            },
            'foo:bar;'
          )
        })

        o('null leafs in arry, followed by a value', function() {
          checkinline(
            {
              foo: [null, 'bar']
            },
            'foo:bar;'
          )
        })

        o('undefined leafs in arry, followed by a value', function() {
          checkinline(
            {
              foo: [void 8, 'bar']
            },
            'foo:bar;'
          )
        })

        o('undefined value', function() {
          checkinline(
            void 8,
            ''
          )
        })

        o('null in Array', function() {
          checkinline(
            [null],
            ''
          )
        })

        o('undefined in Array', function() {
          checkinline(
            [void 8],
            ''
          )
        })

        o('null in Array followed by object', function() {
          checkinline(
            [null, {
              foo: 'bar'
            }],
            'foo:bar;'
          )
        })

        o('undefined in Array followed by object', function() {
          checkinline(
            [void 8, {
              foo: 'bar'
            }],
            'foo:bar;'
          )
        })

        o('object followed by null in Array', function() {
          checkinline(
            [{
              foo: 'bar'
            }, null],
            'foo:bar;'
          )
        })

        o('object followed by undefined in Array', function() {
          checkinline(
            [{
              foo: 'bar'
            }, void 8],
            'foo:bar;'
          )
        })


        // /////////////////////////////////
        // /**/  suite('j2c().prefix: ')  /**/
        // /////////////////////////////////


        // o('1 x 1', function() {
        //   var prod = j2c().prefix('foo', ['o'])
        //   equals(prod[0], '-o-foo')
        //   equals(prod[1], 'foo')
        // })

        // o('2 x 1', function() {
        //   var prod = j2c().prefix('foo', ['o', 'p'])
        //   equals(prod[0], '-o-foo')
        //   equals(prod[1], '-p-foo')
        //   equals(prod[2], 'foo')
        // })
      })
      o.spec("localizing and config", function(){
        o("works without a config object", function() {
          var _j2c = j2c()
          var css = _j2c.inline({animationName:'foo'})
          
          o(css).equals('animation-name:foo'+_j2c.suffix+';\n')
          o(_j2c.names.foo).equals('foo'+_j2c.suffix)
        })
        o("works with an empty config object", function() {
          var _j2c = j2c()
          var css = _j2c.inline({animationName:'foo'}, {})

          o(css).equals('animation-name:foo'+_j2c.suffix+';\n')
          o(_j2c.names.foo).equals('foo'+_j2c.suffix)
        })
        o("works with an global:false config", function() {
          var _j2c = j2c()
          var css = _j2c.inline({animationName:'foo'}, {global: false})

          o(css).equals('animation-name:foo'+_j2c.suffix+';\n')
          o(_j2c.names.foo).equals('foo'+_j2c.suffix)
        })
        o("works with an global:true config", function() {
          var _j2c = j2c()
          var css = _j2c.inline({animationName:'foo'}, {global: true})

          o(css).equals('animation-name:foo;\n')
          o(_j2c.names.foo).equals(void 8)
        })
      })
    })

    o.spec('j2c().sheet: ', function() {
      o('direct sheet call', function() {
        check(
          j2c().sheet({
            p: {
              foo: 5
            }
          }),
          'p{foo:5}'
        )
      })
    })

    o.spec('Definitions: ', function() {
      o('basic', function() {
        check(
          j2c().sheet({
            p: {
              foo: 'bar'
            }
          }),
          'p{foo:bar}'
        )
      })

      o('convert underscores', function() {
        check(
          j2c().sheet({
            p: {
              foo_foo: 'bar'
            }
          }),
          'p{foo-foo:bar}'
        )
      })

      o('convert CamelCase', function() {
        check(
          j2c().sheet({
            p: {
              fooFoo: 'bar'
            }
          }),
          'p{foo-foo:bar}'
        )
      })

      o('number values', function() {
        check(
          j2c().sheet({
            p: {
              foo: 5
            }
          }),
          'p{foo:5}'
        )
      })

      o('composed property name', function() {
        check(
          j2c().sheet({
            p: {
              foo: {
                bar: 'baz'
              }
            }
          }),

          'p{foo-bar:baz}'
        )
      })

      o('composed selector : child with a given class', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                ' .foo': {
                  bar: 'baz'
                }
              }
            }
          }),

          'p .foo{bar:baz}'
        )
      })

      o('composed selector: add a class to the root', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                '.foo': {
                  bar: 'baz'
                }
              }
            }
          }),

          'p.foo{bar:baz}'
        )
      })

      o('manual vendor prefixes', function() {
        check(
          j2c().sheet({
            p: {
              _o$_ms$_moz$_webkit$: {
                foo: 'bar'
              }
            }
          }),

          'p {-o-foo:bar;-ms-foo:bar;-moz-foo:bar;-webkit-foo:bar;foo:bar}'
        )
      })

      o('mixing definitions and sub-selectors', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                foo: 'bar',
                ' .foo': {
                  bar: 'baz'
                }
              }
            }
          }),
          'p {foo:bar} p .foo{bar:baz}'
        )
      })
    })

    o.spec('Selector Cartesian product: ', function() {
      o('1 x 2', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                ' .foo': {
                  ':before,:after': {
                    foo: 'bar'
                  }
                }
              }
            }
          }),

          'p .foo:before, p .foo:after {foo:bar}'
        )
      })

      o('2 x 1', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                ' .foo, .bar': {
                  ':before': {
                    foo: 'bar'
                  }
                }
              }
            }
          }),

          'p .foo:before, p .bar:before {foo:bar}'
        )
      })

      o('2 x 2', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                ' .foo, .bar': {
                  ':before,:after': {
                    foo: 'bar'
                  }
                }
              }
            }
          }),

          'p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}'
        )
      })


      o('2 x 3 one of which is empty', function() {
        check(
          j2c().sheet({
            '@global': {
              p: {
                ' .foo, .bar': {
                  ',:before,:after': {
                    foo: 'bar'
                  }
                }
              }
            }
          }),
          'p .foo, p .bar, p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}'
        )
      })

      o("don't split on comas inside double quoted strings ...", function() {
        check(j2c().sheet({
          'a[foo="bar,baz"]': {
            ' p': {
              qux: 5
            }
          }
        }), 'a[foo="bar,baz"] p {qux: 5}')
      })

      o('... nor split on comas inside single quoted strings ...', function() {
        check(j2c().sheet({
          "a[foo='bar,baz']": {
            ' p': {
              qux: 5
            }
          }
        }), "a[foo='bar,baz'] p {qux: 5}")
      })

      o('... nor split on comas inside comments ...', function() {
        check(j2c().sheet({
          'a/*bar,baz*/': {
            ' p': {
              qux: 5
            }
          }
        }), 'a/*bar,baz*/ p {qux: 5}')
      })

      o('... nor split on comas inside parentheses ...', function() {
        check(j2c().sheet({
          'p:any(a, ul)': {
            ' li': {
              qux: 5
            }
          }
        }), 'p:any(a, ul) li {qux: 5}')
      })

      o('... but split in between', function() {
        check(j2c().sheet({
          'a[foo="bar,baz"], a:any(p, ul), a/*bar,baz*/': {
            ' p': {
              qux: 5
            }
          }
        }), 'a[foo="bar,baz"] p, a:any(p, ul) p, a/*bar,baz*/ p {qux: 5}')
      })
    })

    o.spec('Ampersand: ', function() {
      o('.foo &', function() {
        check(
          j2c().sheet({
            p: {
              ':global(.foo) &': {
                bar: 'baz'
              }
            }
          }),
          '.foo p{bar:baz}'
        )
      })

      o('& &', function() {
        check(
          j2c().sheet({
            ':global(.foo)': {
              '& &': {
                bar: 'baz'
              }
            }
          }),
          '.foo .foo{bar:baz}'
        )
      })

      o('& [bar="&"].baz', function() {
        check(
          j2c().sheet({
            ':global(.foo)': {
              '& [bar="&"]:global(.baz)': {
                qux: 'quux'
              }
            }
          }),
          '.foo [bar="&"].baz{qux:quux}'
        )
      })

      o("& [bar='&'].baz", function() {
        check(
          j2c().sheet({
            ':global(.foo)': {
              '& [bar="&"]:global(.baz)': {
                qux: 'quux'
              }
            }
          }),
          '.foo [bar="&"].baz{qux:quux}'
        )
      })

      o('& /*&*/.baz', function() {
        check(
          j2c().sheet({
            ':global(.foo)': {
              '&  /*&*/:global(.baz)': {
                qux: 'quux'
              }
            }
          }),
          '.foo /*&*/.baz{qux:quux}'
        )
      })

      o(' /*&*/.baz', function() {
        check(
          j2c().sheet({
            ':global(.foo)': {
              ' /*&*/:global(.baz)': {
                qux: 'quux'
              }
            }
          }),
          '.foo /*&*/.baz{qux:quux}'
        )
      })

      o('& &, cartesian product', function() {
        check(
          j2c().sheet({
            'p,a': {
              '& &': {
                bar: 'baz'
              }
            }
          }),
          'p p,p a,a p,a a {bar:baz}'
        )
      })

      o(' :global(.baz) &, :global(.qux)', function() {
        check(
          j2c().sheet({
            p: {
              ' :global(.foo), :global(.bar)': {
                ' :global(.baz) &, :global(.qux)': {
                  foo: 'bar'
                }
              }
            }
          }),
          '.baz p .foo,.baz p .bar,p .foo .qux ,p .bar .qux {foo:bar}'
        )
      })

      o('& in @global context', function() {
        check(
          j2c().sheet({
            '@global': {
              '.foo': {
                '& &': {
                  bar: 'baz'
                }
              }
            }
          }),
          '.foo .foo{bar:baz}'
        )
      })
    })

    o.spec('Strings and Arrays: ', function() {
      o('String literal', function() {
        check(
          j2c().sheet({
            p: 'foo:bar'
          }),
          'p{foo:bar}'
        )
      })

      o('String literal with two declarations', function() {
        check(
          j2c().sheet({
            p: 'foo:bar;baz:qux'
          }),
          'p {foo:bar;baz:qux}'
        )
      })

      o('String literal starting with an underscore', function() {
        check(
          j2c().sheet({
            p: '_foo:bar'
          }),
          'p {_foo:bar}'
        )
      })

      o('Array of String literals', function() {
        check(
          j2c().sheet({
            p: ['foo:bar', 'foo:baz']
          }),
          'p{foo:bar;foo:baz}'
        )
      })


      o('overloaded properties', function() {
        check(
          j2c().sheet({
            p: {
              foo: ['bar', 'baz']
            }
          }),
          'p{foo:bar;foo:baz}'
        )
      })

      o('overloaded sub-properties', function() {
        check(
          j2c().sheet({
            p: {
              foo: [{
                bar: 'baz'
              }, {
                bar: 'qux'
              }]
            }
          }),
          'p{foo-bar:baz;foo-bar:qux}'
        )
      })

      o('nested Arrays', function() {
        check(
          j2c().sheet({
            p: [
              [{
                bar: 'baz'
              }, {
                bar: 'qux'
              }],
              'bar:quux;'
            ]
          }),
          'p{bar:baz;bar:qux;bar:quux}'
        )
      })



      //   ///////////////////////////////////////////
      //  /**/  suite("Sheet auto prefixes: ");  /**/
      // ///////////////////////////////////////////

      // o("String literal", function() {
      //     check(
      //         j2c().sheet({" p": "foo:bar"}, {vendors: ["o", "p"]}),
      //         "p{-o-foo:bar;-p-foo:bar;foo:bar}"
      //     );
      // });

      // o("Array of Strings", function() {
      //     check(
      //         j2c().sheet({" p": ["foo:bar", "_baz:qux"]}, {vendors: ["o", "p"]}),
      //         "p{-o-foo:bar;-p-foo:bar;foo:bar;-o-_baz:qux;-p-_baz:qux;_baz:qux}"
      //     );
      // });
    })

    o.spec('At-rules: ', function() {
      o('@charset', function() {
        check(
          j2c().sheet({
            '@charset': '"UTF-8"'
          }),

          '@charset "UTF-8";'
        )
      })

      o('@import', function() {
        check(
          j2c().sheet({
            '@import': 'url("bluish.css") projection, tv'
          }),

          '@import url("bluish.css") projection, tv;'
        )
      })

      o('@namespace', function() {
        check(
          j2c().sheet({
            '@namespace': 'prefix url(XML-namespace-URL)'
          }),

          '@namespace prefix url(XML-namespace-URL);'
        )
      })

      o('@media', function() {
        check(
          j2c().sheet({
            p: {
              '@media foo': {
                bar: 'baz'
              }
            }
          }),

          '@media foo {p{bar:baz}}'
        )
      })

      o('@supports', function() {
        check(
          j2c().sheet({
            '@supports not (text-align-last:justify)': {
              'p': {
                textAlignLast: 'justify'
              }
            }
          }),

          '@supports not (text-align-last:justify) {p {text-align-last:justify}}'
        )
      })

      o('@page', function() {
        check(
          j2c().sheet({
            '@page :first': {
              margin: '2in 3in'
            }
          }),

          '@page :first {margin: 2in 3in;}'
        )
      })

      o('several @media with object value', function() {
        check(
          j2c().sheet({
            p: {
              '@media foo': {
                bar: 'baz'
              },
              '@media foo2': {
                bar2: 'baz2'
              }
            }
          }), [
            '@media foo {p{bar:baz}} @media foo2 {p{bar2:baz2}}'
          ]
        )
      })

      o('Array of @import with text values', function() {
        check(
          j2c().sheet([{
            '@import': "'bar'"
          }, {
            '@import': "'baz'"
          }]),
          "@import 'bar'; @import 'baz';"
        )
      })

      o('nested @media', function() {
        check(
          j2c().sheet({
            p: {
              '@media screen': {
                width: 1000,
                '@media (max-width: 12cm)': {
                  size: 5
                }
              }
            }
          }), [
            '@media screen{p{width:1000}@media (max-width:12cm){p{size:5}}}'
          ]
        )
      })

      o('@font-face', function() {
        check(
          j2c().sheet({
            '@font-face': {
              foo: 'bar'
            }
          }),
          '@font-face{foo:bar}'
        )
      })

      o('@keyframes', function() {
        check(
          j2c().sheet({
            '@keyframes global(qux)': {
              from: {
                foo: 'bar'
              },
              to: {
                foo: 'baz'
              }
            }
          }),
          '@keyframes qux{from{foo:bar}to{foo:baz}}'
        )
      })

      o('invalid @foo becomes @-error-unsupported-at-rule "@foo"', function() {
        check(
          j2c().sheet({
            '@foo': 'bar'
          }),
          '@-error-unsupported-at-rule "@foo";'
        )

      })

      o('invalid @ becomes @-error-unsupported-at-rule "@"', function() {
        check(
          j2c().sheet({
            '@': 'bar'
          }),
          '@-error-unsupported-at-rule "@";'
        )

      })
    })

    o.spec('At-rules with prefixes: ', function() {
      o('@-webkit-keyframes', function() {
        check(
          j2c().sheet({
            '@-webkit-keyframes global(qux)': {
              from: {
                foo: 'bar'
              },
              to: {
                foo: 'baz'
              }
            }
          }),
          '@-webkit-keyframes qux{from{foo:bar}to{foo:baz}}'
        )
      })
    })

    o.spec('At-rules with array values: ', function() {
      o('@font-face with a 1-element array', function() {
        check(
          j2c().sheet({
            '@font-face': [{
              foo: 'bar'
            }]
          }),
          '@font-face{foo:bar}'
        )
      })

      o('@font-face with a 2-elements array', function() {
        check(
          j2c().sheet({
            '@font-face': [{
              foo: 'bar'
            }, {
              foo: 'baz'
            }]
          }),
          '@font-face{foo:bar}@font-face{foo:baz}'
        )
      })

      o('@namespace with a 1-element array', function() {
        check(
          j2c().sheet({
            '@namespace': ["'http://foo.example.com'"]
          }),
          "@namespace 'http://foo.example.com';"
        )
      })

      o('@namespace with a 2-elements array', function() {
        check(
          j2c().sheet({
            '@namespace': ["'http://foo.example.com'", "bar 'http://bar.example.com'"]
          }),
          "@namespace 'http://foo.example.com';@namespace bar 'http://bar.example.com';"
        )
      })
    })

    o.spec('@adopt: ', function() {
      o('basic usage', function() {
        var _j2c = j2c()
        equals(_j2c.sheet({
          '@adopt foo': 'bar'
        }), '')
        has_key(_j2c.names, 'foo')
        equals(_j2c.names.foo, 'foo' + _j2c.suffix + ' bar')
      })

      o('basic usage (with dots)', function() {
        var _j2c = j2c()
        equals(_j2c.sheet({
          '@adopt .foo': '.bar'
        }), '')
        has_key(_j2c.names, 'foo')
        equals(_j2c.names.foo, 'foo' + _j2c.suffix + ' bar')
      })

      o('array of adoptees', function() {
        var _j2c = j2c()
        equals(_j2c.sheet({
          '@adopt foo': ['.bar', 'baz']
        }), '')
        has_key(_j2c.names, 'foo')
        equals(_j2c.names.foo, 'foo' + _j2c.suffix + ' bar baz')
      })

      o('bad target name', function() {
        var _j2c = j2c()
        check(
          _j2c.sheet({
            '@adopt /foo': '.bar'
          }),
          '@-error-bad-at-adopter /foo;'
        )
        doesnt_have_key(_j2c.names, '/foo')
        doesnt_have_key(_j2c.names, 'foo')

      })

      o('bad parameter name', function() {
        var _j2c = j2c()
        check(
          _j2c.sheet({
            '@adopt foo': '/bar'
          }),
          '@-error-bad-at-adoptee "/bar";'
        )
        doesnt_have_key(_j2c.names, 'foo')

      })

      o('forbidden in global scope', function() {
        var _j2c = j2c()
        check(
          _j2c.sheet({
            '@global': {
              '@adopt foo': 'bar'
            }
          }),
          '@-error-bad-at-adopt-placement "@adopt foo";'
        )
        doesnt_have_key(_j2c.names, 'foo')

      })

      o('forbidden in conditional scope', function() {
        var _j2c = j2c()
        check(
          _j2c.sheet({
            '@media screen': {
              '@adopt foo': 'bar'
            }
          }),
          '@media screen{@-error-bad-at-adopt-placement "@adopt foo";}'
        )
        doesnt_have_key(_j2c.names, 'foo')

      })
    })

    o.spec('Locals, Globals ', function() {
      o('a local class', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            foo: 5
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        contains(css, '.' + names.bit + ' {\nfoo:5;\n}')
      })

      o("a local class in a doubly quoted string shouldn't be localized", function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '[foo=".bit"]': {
            foo: 5
          }
        })
        equals(names.bit, undefined)
        check(css, '[foo=".bit"]{foo:5;}')
      })

      o("a local class in a singly quoted string shouldn't be localized", function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          "[foo='.bit']": {
            foo: 5
          }
        })
        equals(names.bit, undefined)
        check(css, "[foo='.bit']{foo:5;}")
      })

      o("a local class in a comment shouldn't be localized", function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          'p/*.bit*/': {
            foo: 5
          }
        })
        equals(names.bit, undefined)
        check(css, 'p/*.bit*/{foo:5;}')
      })

      o('Mixing strings and comments (regexp validation)', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          "/*'*/.bit/*'*/": {
            foo: 5
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        check(css, "/*'*/." + names.bit + "/*'*/{foo:5;}")
      })

      o('two local classes', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            foo: 5
          },
          '.bat': {
            bar: 6
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, 'bat' + _j2c.suffix)
        contains(css, '.' + names.bit + ' {\nfoo:5;\n}')
        contains(css, '.' + names.bat + ' {\nbar:6;\n}')
      })

      o('a local and a global class', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            foo: 5
          },
          ':global(.bat)': {
            bar: 6
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, undefined)
        contains(css, '.' + names.bit + ' {\nfoo:5;\n}')
        contains(css, '.bat {\nbar:6;\n}')
      })

      o('a local wrapping a global block', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            '@global': {
              '.bat': {
                foo: 5
              }
            }
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, undefined)
        contains(css, '.' + names.bit + '.bat {\nfoo:5;\n}')
      })

      o('two local classes, nested', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            foo: 5,
            '.bat': {
              bar: 6
            }
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, 'bat' + _j2c.suffix)
        contains(css, '.' + names.bit + ' {\nfoo:5;\n}')
        contains(css, '.' + names.bit + '.' + names.bat + ' {\nbar:6;\n}')
      })

      o('@keyframes', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '@keyframes bit': {}
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        contains(css, '@keyframes ' + names.bit + ' {')
      })

      o('@keyframes with a CSS variable as name', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '@keyframes var(--foo)': {}
        })
        doesnt_have_key(names, 'var')
        contains(css, '@keyframes var(--foo) {')
      })

      o('a global @keyframes', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '@keyframes global(bit)': {}
        })
        equals(names.bit, undefined)
        contains(css, '@keyframes bit {')
      })

      o('a @keyframe nested in a @global at-rule', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '@global': {
            '@keyframes bat': {
              'from': {
                foo: 6
              }
            }
          }
        })
        equals(names.bat, undefined)
        contains(css, '@keyframes bat {')
      })

      o('one animation', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation: 'bit 1sec'
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        contains(css, 'animation:' + names.bit + ' ')
      })

      o('a global animation', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation: 'global(bit) 1sec'
          }
        })
        equals(names.bit, undefined)
        contains(css, 'animation:bit ')
      })

      o('an animation nested in a @global at-rule', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '@global': {
            p: {
              animation: 'bit 1sec'
            }
          }
        })
        equals(names.bit, undefined)
        contains(css, 'animation:bit ')
      })

      o('one animation with a CSS variable', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation: 'var(--foo) 1sec'
          }
        })
        doesnt_have_key(names, 'var')
        contains(css, 'animation:var(--foo) 1sec;')
      })

      o('one animation-name', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation_name: 'bit'
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        contains(css, 'animation-name:' + names.bit + ';')
      })

      o('two animation-name', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation_name: 'bit, bat'
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, 'bat' + _j2c.suffix)
        contains(css, 'animation-name:' + names.bit + ', ' + names.bat)
      })

      o('two animation-name, one global', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation_name: 'bit, global(bat)'
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, undefined)
        contains(css, 'animation-name:' + names.bit + ', bat;')
      })

      o('one animation-name with a CSS variable', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          p: {
            animation_name: 'var(--foo)'
          }
        })
        doesnt_have_key(names, 'var')
        contains(css, 'animation-name:var(--foo);')
      })

      o('a nested @global at-rule', function() {
        var _j2c = j2c()
        var names = _j2c.names
        var css = _j2c.sheet({
          '.bit': {
            '@global': {
              '.bat': {
                'foo': 6
              }
            }
          }
        })
        equals(names.bit, 'bit' + _j2c.suffix)
        equals(names.bat, undefined)
        contains(css, names.bit + '.bat {')
      })

      o('a @local rule nested in a @global block', function() {
        check(
          j2c().sheet({
            '@global': {
              '.bit': {
                '@local': {
                  ':global(.bat)': {
                    'foo': 6
                  }
                }
              }
            }
          }),
          '.bit.bat {foo:6}'
        )
      })
    })

    o.spec('Foolproofing: ', function() {
      o('property-like sub-selector', function() {
        check(
          j2c().sheet('color:red'),
          ':-error-no-selector {color:red}'
        )
      })
    })
  })

  o.spec('Order: ', function() {
    o('two properties', function() {
      check(J2C().sheet({
        p: {
          foo: 'bar',
          baz: 'qux'
        }
      }), 'p {\nfoo:bar;\nbaz:qux;\n}')
    })

    o('$ combiner', function() {
      check(J2C().sheet({
        p: {
          foo$baz: 'qux'
        }
      }), 'p {\nfoo:qux;\nbaz:qux;\n}')
    })

    o('source order is respected when mixing declarations, subselectors and at rules', function() {
      var prop = randStr()
      var klass = randStr()
      var width = randInt()

      var permutations = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
        [0, 2, 1],
        [1, 0, 2]
      ]

      var jsKeys = [
        prop,
        '.' + klass,
        '@media (min-width: ' + width + 'em)'
      ]

      var o = {}
      o[prop] = 5
      o['.' + klass] = {
        foo: 6
      }
      o['@media (min-width: ' + width + 'em)'] = {
        bar: 7
      }

      var rules = [
        'p{' + prop + ':5;}',
        'p.' + klass + '{foo:6;}',
        '@media (min-width: ' + width + 'em){p{bar:7;}}'
      ]

      var J2C_1 = J2C()

      // This second instance ensures that we don't rely on the falsy return value
      // of the default buffer methods.
      // This happens in this test because it vists most if not all of the code paths
      // where this may be relevant, especially in `src/sheet.js`.
      var J2C_2 = J2C().use({
        $filter: function(next) {
          return {
            done: next.done,
            init: function() {
              next.init.apply(next, arguments)
              return true
            },
            atrule: function() {
              next.atrule.apply(next, arguments)
              return true
            },
            _atrule: function() {
              next._atrule.apply(next, arguments)
              return true
            },
            decl: function() {
              next.decl.apply(next, arguments)
              return true
            },
            rule: function() {
              next.rule.apply(next, arguments)
              return true
            },
            _rule: function() {
              next._rule.apply(next, arguments)
              return true
            }
          }
        }
      })


      permutations.forEach(function(indices) {
        var source = {
          p: {}
        }
        var CSS = []
        indices.forEach(function(i) {
          source.p[jsKeys[i]] = o[jsKeys[i]]
          CSS.push(rules[i])
        })
        equals(normalize(J2C_1.sheet({
          '@global': source
        })), normalize(CSS.join('')))
        equals(normalize(J2C_2.sheet({
          '@global': source
        })), normalize(CSS.join('')))
      })
    })

    o('@namespace then selector', function() {
      check(J2C().sheet({
        '@namespace': "'foo'",
        p: {
          foo: 'bar'
        }
      }), "@namespace 'foo';p{foo:bar;}")
    })
  })

  o.spec('Extras: ', function() {
    o('J2C.kv()', function() {
      has_type(J2C.kv, Function)
      has_type(J2C().kv, Function)
      equals(J2C.kv, J2C().kv)
      var o = J2C.kv('k', 'v')
      has_key(o, 'k')
      equals(o.k, 'v')
    })

    o('J2C.global()', function() {
      has_type(J2C.global, Function)
      has_type(J2C().global, Function)
      equals(J2C.global, J2C().global)
      equals(J2C.global('foo'), ':global(foo)')
    })

    o('J2C.at(), basics', function() {
      has_type(J2C.at, Function)
      has_type(J2C().at, Function)
      equals(J2C.at, J2C().at)
    })

    o('J2C.at(), as an object key', function() {
      equals(J2C.at('foo', 'bar') + '', '@foo bar')
    })

    o('J2C.at(), as an object key, curried', function() {
      equals(J2C.at('foo')('bar') + '', '@foo bar')
      equals(J2C.at()('foo')('bar') + '', '@foo bar')
      equals(J2C.at('foo')()('bar') + '', '@foo bar')
      equals(J2C.at('foo')('bar')() + '', '@foo bar')
    })

    o('J2C.at(), as an object generator', function() {
      var atFoo = J2C.at('foo', 'bar', {
        baz: 'qux'
      })
      has_key(atFoo, '@foo bar')
      has_type(atFoo['@foo bar'], Object)
      has_key(atFoo['@foo bar'], 'baz')
      equals(atFoo['@foo bar'].baz, 'qux')
    })

    o('J2C.at(), as an object generator, curried 1', function() {
      var atFoo = J2C.at('foo')('bar', {
        baz: 'qux'
      })
      has_key(atFoo, '@foo bar')
      has_type(atFoo['@foo bar'], Object)
      has_key(atFoo['@foo bar'], 'baz')
      equals(atFoo['@foo bar'].baz, 'qux')
    })

    o('J2C.at(), as an object generator, curried 2', function() {
      var atFoo = J2C.at('foo', 'bar')({
        baz: 'qux'
      })
      has_key(atFoo, '@foo bar')
      has_type(atFoo['@foo bar'], Object)
      has_key(atFoo['@foo bar'], 'baz')
      equals(atFoo['@foo bar'].baz, 'qux')
    })

    o('J2C.at(), as an object generator, curried 3', function() {
      var atFoo = J2C.at('foo')('bar')({
        baz: 'qux'
      })
      has_key(atFoo, '@foo bar')
      has_type(atFoo['@foo bar'], Object)
      has_key(atFoo['@foo bar'], 'baz')
      equals(atFoo['@foo bar'].baz, 'qux')
    })
  })

  o.spec('Plugins: ', function() {
    o('an empty array as plugin', function() {
      check(
        J2C().use([]).sheet({
          p: {
            color: 'red'
          }
        }),
        'p{color:red;}'
      )
    })

    o('an null plugin', function() {
      check(
        J2C().use(null).sheet({
          p: {
            color: 'red'
          }
        }),
        'p{color:red;}'
      )
    })

    o('an invalid $plugin', function() {
      var _J2C = J2C().use({
        $invalid: 'foo'
      })
      check(
        _J2C.sheet({
          p: {
            color: 'red'
          }
        }),
        'p{color:red;}'
      )
      doesnt_have_key(_J2C, '$invalid')
    })

    o('a plugin that sets a property on the instance', function() {
      var _J2C = J2C().use({
        testProp: 'foo'
      })
      check(
        _J2C.sheet({
          p: {
            color: 'red'
          }
        }),
        'p{color:red;}'
      )
      has_key(_J2C, 'testProp')
      equals(_J2C.testProp, 'foo')
    })

    o('a plugin that sets a property on the instance that already exists', function() {
      var _J2C = J2C().use({
        sheet: 'foo'
      })
      differs(_J2C.sheet, 'foo')
      check(
        _J2C.sheet({
          p: {
            color: 'red'
          }
        }),
        'p{color:red;}'
      )

      differs(_J2C.sheet, 'foo')
    })

    o('Plugin deduplication', function() {
      var p = {}
      var _J2C = J2C().use(p, p)
      equals(_J2C.$plugins.length, 1)
    })
  })

  o.spec('names plugins for J2C.inline()', function() {
    o('namespaced animation', function() {
      check(
        J2C().use({
          $names: {
            foo: 'theFoo'
          }
        }).inline({
          animation: 'foo 1sec'
        }),
        'animation:theFoo 1sec;'
      )
    })

    o('namespaced animation-name', function() {
      check(
        J2C().use({
          $names: {
            foo: 'theFoo'
          }
        }).inline({
          animation_name: 'foo'
        }),
        'animation-name:theFoo;'
      )
    })

    o('namespaced and non-namespaced animation-name', function() {
      var _J2C = J2C().use({
        $names: {
          foo: 'theFoo'
        }
      })
      var result = _J2C.inline({
        animation_name: 'foo, bar'
      })
      check(
        result,
        'animation-name:theFoo, ' + _J2C.names.bar + ';'
      )
    })

    o('two namespaced animations', function() {
      var result = J2C().use({
        $names: {
          foo: 'theFoo',
          bar: 'theBar'
        }
      }).inline({
        animation: 'foo 1sec, bar 2sec'
      })
      check(
        result,
        'animation:theFoo 1sec, theBar 2sec;'
      )
    })
  })

  o.spec('names plugins for J2C.sheet()', function() {
    o('namespaced class', function() {
      var _J2C = J2C().use({
        $names: {
          foo: 'FOOO'
        }
      })
      var names = _J2C.names
      var css = _J2C.sheet({
        '.foo': {
          foo: 'bar',
          baz: 'qux'
        }
      })
      check('' + css, '.FOOO{foo:bar;baz:qux;}')
      equals(names.foo, 'FOOO')
    })

    o('namespaced class wrapping a global block', function() {
      var _J2C = J2C().use({
        $names: {
          foo: 'FOOO'
        }
      })
      var names = _J2C.names
      var css = _J2C.sheet({
        '.foo': {
          '@global': {
            '.foo': {
              foo: 'bar',
              baz: 'qux'
            }
          }
        }
      })
      check('' + css, '.FOOO.foo{foo:bar;baz:qux;}')
      equals(names.foo, 'FOOO')
    })

    o('namespaced @keyframes', function() {
      var _J2C = J2C().use({
        $names: {
          bit: 'BOT'
        }
      })
      var names = _J2C.names
      var css = _J2C.sheet({
        '@keyframes bit': {}
      })
      equals(names.bit, 'BOT')
      contains(css, '@keyframes BOT {')
    })

    o('namespaced animation', function() {
      var _J2C = J2C().use({
        $names: {
          bit: 'BOT'
        }
      })
      var names = _J2C.names
      var css = _J2C.sheet({
        p: {
          animation: 'bit 1sec'
        }
      })
      equals(names.bit, 'BOT')
      check(css, 'p{animation:BOT 1sec;}')
    })

    o('namespaced animation-name', function() {
      var _J2C = J2C().use({
        $names: {
          bit: 'BOT'
        }
      })
      var names = _J2C.names
      var css = _J2C.sheet({
        p: {
          animation_name: 'bit'
        }
      })
      equals(names.bit, 'BOT')
      check(css, 'p{animation-name:BOT;}')
    })

    o("don't overwrite an existing name", function() {
      var _J2C = J2C().use({
        $names: {
          bit: 'BOT'
        }
      }, {
        names: {
          bit: 'BUT'
        }
      })
      var names = _J2C.names
      equals(names.bit, 'BOT')
    })
  })

  o.spec('$filter plugins', function() {
    o('a sheet filter', function() {
      function filter(J2C) {
        has_type(J2C, Object)
        has_type(J2C.sheet, Function)

        return {
          $filter: function(next, inline) {
            has_type(next, Object)
            has_type(next.init, Function)
            has_type(next.done, Function)
            has_type(next.decl, Function)
            if (!inline) {
              has_type(next.rule, Function)
              has_type(next._rule, Function)
              has_type(next.atrule, Function)
              has_type(next._atrule, Function)
            }

            return {
              init: function() {
                next.init()
                equals(!!inline, false)
              },
              done: function() {
                var buf = next.done(1)
                has_type(buf, Array)
                differs(buf.length, 0)
                var txt = next.done()
                has_type(txt, 'string')
                return txt
              },
              atrule: function(name, arg, hasBlock) {
                next.atrule(name + 'o', 'a' + arg, hasBlock)
              },
              _atrule: function(name, arg) {
                next._atrule(name + 'o', 'a' + arg)
              },
              decl: function(prop, value) {
                next.decl('p' + prop, 'v' + value)
              },
              rule: function(selector) {
                next.rule('h1, ' + selector)
              },
              _rule: function() {
                next._rule()
              }
            }
          }
        }
      }
      check(
        J2C().use(filter).sheet({
          '@global': {
            '@import': 'foo',
            p: {
              foo: 'bar'
            },
            '@keyframes foo': {
              from: {
                foo: 'baz'
              }
            }
          }
        }),
        '@importo afoo;' +
        'h1, p {pfoo:vbar}' +
        '@keyframeso afoo{h1, from{pfoo:vbaz}}'
      )
    })

    o('a declaration filter', function() {
      function filter(J2C) {
        has_type(J2C, Object)
        has_type(J2C.inline, Function)

        return {
          $filter: function(next, inline) {
            has_type(next, Object)
            has_type(next.init, Function)
            has_type(next.done, Function)
            has_type(next.decl, Function)
            if (!inline) {
              has_type(next.rule, Function)
              has_type(next._rule, Function)
              has_type(next.atrule, Function)
              has_type(next._atrule, Function)
            }

            return {
              init: function() {
                next.init()
                equals(!!inline, true)
              },
              done: function() {
                var buf = next.done(true)
                has_type(buf, Array)
                differs(buf.length, 0)
                var txt = next.done()
                has_type(txt, 'string')
                return txt
              },
              decl: function(prop, value) {
                next.decl('p' + prop, 'v' + value)
              }
            }
          }
        }
      }
      check(
        J2C().use(filter).inline({
          foo: 'bar'
        }),
        'pfoo:vbar;'
      )
    })

    o('filter order', function() {
      var acc = []

      function filter(x) {
        return {
          $filter: function(next) {
            return {
              rule: function() {
                acc.push(x)
                return next.rule.apply(next, arguments)
              }
            }
          }
        }
      }
      J2C().use(filter(1), filter(2)).sheet({
        '.foo': 'bar:baz;'
      })
      equals(acc.length, 2)
      equals(acc[0], 1)
      equals(acc[1], 2)
    })

    o('filter dedupe', function() {
      var acc = []

      function filter(x) {
        return {
          $filter: function(next) {
            return {
              rule: function(selector) {
                acc.push(x)
                next.rule(selector)
              }
            }
          }
        }
      }
      var f = filter(1)
      J2C().use(f, f).sheet({
        '.foo': 'bar:baz;'
      })
      equals(acc.length, 1)
      equals(acc[0], 1)
    })

    o('filter default', function() {
      var acc = []
      check(
        J2C().use({
          $filter: function(next) {
            return {
              rule: function(selector) {
                acc.push(selector)
                return next.rule(selector + 're')
              }
            }
          }
        }).sheet({
          'p': 'bar:baz;'
        }),
        'pre{bar:baz}'
      )
      equals(acc.length, 1)
      equals(acc[0], 'p')
    })
  })

  o.spec('$at plugins', function() {
    o('one $at plugin', function() {
      function plugin(name) {
        return {
          $at: function(walker, emit, match, v, prefix, local, inAtRule) {
            has_type(match, Array)
            has_type(walker, Object)
            has_key(walker, '$atHandlers')
            has_key(walker, 'atrule')
            has_key(walker, 'rule')
            has_key(walker, 'decl')
            has_key(walker, 'localize')
            has_key(walker, 'localizeReplacer')
            has_key(walker, 'names')

            has_type(emit, Object)
            has_key(emit, 'atrule')

            equals(v, 'param')

            has_type(prefix, 'string')
              // `local` can be many things, the only things that matters is its truthiness
            equals(!!local, true)
              // `inAtRule` can be many things, the only things that matters is its truthiness
            equals(!!inAtRule, false)

            if (match[2] !== name) return false
            emit.atrule(match[1], v)
            return true
          }
        }
      }
      check(
        J2C().use(plugin('foo')).sheet({
          '@foo': 'param',
          '@bar': 'param',
          '@baz': 'param'
        }),
        '@foo param; @-error-unsupported-at-rule "@bar"; @-error-unsupported-at-rule "@baz";'
      )
    })

    o('two $at plugins', function() {
      function plugin(name) {
        return {
          $at: function(walker, emit, match, v) {
            if (match[2] !== name) return false
            emit.atrule(match[1], v)
            return true
          }
        }
      }
      check(
        J2C().use(plugin('foo'), plugin('bar')).sheet({
          '@foo': 'bar',
          '@bar': 'baz',
          '@baz': 'qux'
        }),
        '@foo bar; @bar baz; @-error-unsupported-at-rule "@baz";'
      )
    })

    o('$at plugin has precedence over default at-rules', function() {
      var plugin = {
        $at: function(walker, emit, match, v) {
          if (match[2] !== 'import') return false
          emit.atrule('@intercepted', v)
          return true
        }
      }

      check(
        J2C().use(plugin).sheet({
          '@import': 'foo'
        }),
        '@intercepted foo;'
      )
    })

    o('$at plugin that verifies malformed rules are properly passed unparsed', function() {
      var plugin = {
        $at: function(walker, emit, match, v) {

          equals(match[0], '@; hey')
          equals(match[1], '@')
          equals(match[2], '')
          equals(match[3], '')
          equals(v, 'foo')
          return true
        }
      }

      check(
        J2C().use(plugin).sheet({
          '@; hey': 'foo'
        }),
        ''
      )
    })
  })
}) // DONE!
o.run()




// TODO
//
// - spy on String.prototype.replace and RegExp.prototype.*
//   to generate coverage reports for the branches hidden
//   in these native functions.
//
// - verify that all at-rules behave properly in filters
//   (wrt selectors and definitions)
//
// - test `inAtRule` from $at plugins (is it set appropriately?)
//
// - verify that custom at rules take precedence over default ones
//
// - test @keyframes nested in selector scope
//
// - Attach new properties using `.use()`. Verify that old ones are not
//   overwritten