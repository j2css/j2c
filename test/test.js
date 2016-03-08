/*eslint-env node, mocha */

// ensure that we are not sensitive to additions to Object.prototype.
Object.prototype.BADBAD = 5

// used to normalize styles for reliable comparison.
var expect = require('expect.js'),
  minifySelectors = require('postcss-minify-selectors'),
  minifyParams = require('postcss-minify-params'),
  perfectionist = require('perfectionist'),
  postcss = require('postcss')([perfectionist({format:'compressed'}), minifySelectors(), minifyParams()])

function normalize(s) { return postcss.process(s).css }

function check(result, expected){
  result = normalize(result)
  expect(normalize(expected)).to.be(result)
}

function randStr() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
}
function randInt() {
  return Math.random().toString().substr(2, 3)
}

[
  '../dist/j2c.commonjs.min',
  '../dist/j2c.commonjs'
  // ,
  // '../dist/inline/j2c.commonjs',
  // '../dist/inline/j2c.commonjs.min'
].forEach(function(lib){
  var J2C = require(lib)
  ;[
    function(){
      Object.keys(J2C.names).forEach(function(k){delete J2C.names[k]})
      return J2C
    },
    function(){return J2C()}
  ].forEach(function(j2c){

    function checkinline(result, expected){
      result = 'p{' + j2c().inline(result) + '}'
      expected = (expected instanceof Array ? expected : [expected]).map(function(s){
        return 'p{' + s + '}'
      })
      check(result, expected)
    }



    /////////////////////////////
    /**/  suite('Inline: ')  /**/
    /////////////////////////////


    test('a single property', function() {
      checkinline(
        {foo: 'bar'},
        'foo:bar;'
      )
    })

    test('two properties, ensure order', function() {
      checkinline(
        {foo: 'bar', baz: 'qux'},
        'foo:bar; baz:qux;'
      )
    })

    test('array of values', function() {
      checkinline(
        {foo:['bar', 'baz']},
        'foo:bar; foo:baz;'
      )
    })

    test('one sub-property', function(){
      checkinline(
        {foo: {bar: 'baz'}},
        'foo-bar: baz;'
      )
    })

    test('two declrations at the top level', function() {
      checkinline(
        {foo: 'qux', baz: 'qux'},
        'foo:qux;baz:qux;'
      )
    })

    test('two sub-properties', function(){
      checkinline(
        {foo: {bar: 'baz', qux: 'baz'}},
        'foo-bar:baz; foo-qux:baz;'
      )
    })

    test('two sub-properties with a sub-sub-property', function(){
      checkinline(
        {foo: {bar: {qux: 'quux'}, baz: {qix: 'qiix'}}},
        'foo-bar-qux:quux; foo-baz-qix:qiix;'
      )
    })

    test('$ operator in sub-property and sub-sub-property', function(){
      checkinline(
        {foo: {bar: {qux: 'fred', quux: 'frod'}, baz: {qix: 'frad', qiix: 'frud'}}},
        'foo-bar-qux:fred; foo-bar-quux:frod; foo-baz-qix:frad; foo-baz-qiix:frud;'
      )
    })

    test('$ operator at the top level', function() {
      checkinline(
        {foo$baz: 'qux'},
        'foo:qux;baz:qux;'
      )
    })

    test('$ operator in sub-properties', function(){
      checkinline(
        {foo: {bar$qux: 'baz'}},
        'foo-bar:baz; foo-qux:baz;'
      )
    })

    test('$ operator in a sub-property with a sub-sub-property', function(){
      checkinline(
        {foo: {bar$baz: {qux: 'quux'}}},
        'foo-bar-qux:quux; foo-baz-qux:quux;'
      )
    })

    test('$ operator in sub-property and sub-sub-property', function(){
      checkinline(
        {foo: {bar$baz: {qux$quux: 'fred'}}},
        'foo-bar-qux:fred; foo-bar-quux:fred; foo-baz-qux:fred; foo-baz-quux:fred;'
      )
    })

    test('convert underscores', function() {
      checkinline(
        {'f_o_o': 'bar'},
        'f-o-o:bar;'
      )
    })

    test('convert CamelCase', function() {
      checkinline(
        {'FoO': 'bar'},
        '-fo-o:bar;'
      )
    })

    test('String value', function() {
      checkinline(
        'foo:bar',
        'foo:bar;'
      )
    })

    test('Array of Strings values', function() {
      checkinline(
        ['foo:bar', 'foo:baz'],
        'foo:bar;foo:baz'
      )
    })

    test('Array of mixed values at the root', function() {
      checkinline(
        ['foo:bar', {foo: 'baz'}],
        'foo:bar;foo:baz'
      )
    })

    test('Array of mixed value and sub-property', function() {
      checkinline(
        {foo:['bar', {baz: 'qux'}]},
        'foo:bar;foo-baz:qux'
      )
    })

    test('Prefixes by hand', function() {
      checkinline(
        {_o$_p$: {foo: 'bar'}},
        '-o-foo:bar;-p-foo:bar;foo:bar;'
      )
    })

    test('CSS *Hack', function() {
      // tested manually because the crass normalization
      // outputs an empty string.
      checkinline(
        {'*foo': 'bar'},
        '*foo:bar;'
      )
    })

    test('CSS _Hack', function() {
      checkinline(
        ['_foo:bar', {_baz: 'qux'}],
        '_foo:bar;-baz:qux;'
      )
    })

    test('custom obj.valueOf', function() {
      var bar = {valueOf:function(){return 'theBAR'}}
      checkinline(
        {foo:bar},
        'foo:theBAR;'
      )
    })



    ////////////////////////////////////
    /**/  suite('Inline, nulls: ')  /**/
    ////////////////////////////////////

    test('null value', function() {
      checkinline(
        null,
        ''
      )
    })

    test('null leafs', function() {
      checkinline(
        {foo:null},
        ''
      )
    })

    test('undefined leafs', function() {
      checkinline(
        {foo:void 8},
        ''
      )
    })

    test('null leafs in array', function() {
      checkinline(
        {foo:[null]},
        ''
      )
    })

    test('undefined leafs in array', function() {
      checkinline(
        {foo:[void 8]},
        ''
      )
    })

    test('null leafs in array, preceded by value', function() {
      checkinline(
        {foo:['bar', null]},
        'foo:bar;'
      )
    })

    test('undefined leafs in array, preceded by value', function() {
      checkinline(
        {foo:['bar', void 8]},
        'foo:bar;'
      )
    })

    test('null leafs in arry, followed by a value', function() {
      checkinline(
        {foo:[null, 'bar']},
        'foo:bar;'
      )
    })

    test('undefined leafs in arry, followed by a value', function() {
      checkinline(
        {foo:[void 8, 'bar']},
        'foo:bar;'
      )
    })

    test('undefined value', function() {
      checkinline(
        void 8,
        ''
      )
    })

    test('null in Array', function() {
      checkinline(
        [null],
        ''
      )
    })

    test('undefined in Array', function() {
      checkinline(
        [void 8],
        ''
      )
    })

    test('null in Array followed by object', function() {
      checkinline(
        [null, {foo:'bar'}],
        'foo:bar;'
      )
    })

    test('undefined in Array followed by object', function() {
      checkinline(
        [void 8, {foo:'bar'}],
        'foo:bar;'
      )
    })

    test('object followed by null in Array', function() {
      checkinline(
        [{foo:'bar'}, null],
        'foo:bar;'
      )
    })

    test('object followed by undefined in Array', function() {
      checkinline(
        [{foo:'bar'}, void 8],
        'foo:bar;'
      )
    })


    // /////////////////////////////////
    // /**/  suite('j2c().prefix: ')  /**/
    // /////////////////////////////////


    // test('1 x 1', function() {
    //   var prod = j2c().prefix('foo', ['o'])
    //   expect(prod[0]).to.be('-o-foo')
    //   expect(prod[1]).to.be('foo')
    // })

    // test('2 x 1', function() {
    //   var prod = j2c().prefix('foo', ['o', 'p'])
    //   expect(prod[0]).to.be('-o-foo')
    //   expect(prod[1]).to.be('-p-foo')
    //   expect(prod[2]).to.be('foo')
    // })


    ////////////////////////////////
    /**/  suite('j2c().sheet: ')  /**/
    ////////////////////////////////


    test('direct sheet call', function(){
      check(
        j2c().sheet({p: {foo:5}}),
        'p{foo:5}'
      )
    })



    //////////////////////////////////
    /**/  suite('Definitions: ')  /**/
    //////////////////////////////////


    test('basic', function() {
      check(
        j2c().sheet({p: {
          foo: 'bar'
        }}),
        'p{foo:bar}'
      )
    })

    test('convert underscores', function() {
      check(
        j2c().sheet({p: {
          foo_foo: 'bar'
        }}),
        'p{foo-foo:bar}'
      )
    })

    test('convert CamelCase', function() {
      check(
        j2c().sheet({p: {
          fooFoo: 'bar'
        }}),
        'p{foo-foo:bar}'
      )
    })

    test('number values', function() {
      check(
        j2c().sheet({p: {
          foo:5
        }}),
        'p{foo:5}'
      )
    })

    test('composed property name', function() {
      check(
        j2c().sheet({p: {
          foo: {bar: 'baz'}
        }}),

        'p{foo-bar:baz}'
      )
    })

    test('composed selector : child with a given class', function() {
      check(
        j2c().sheet({'@global': {p: {
          ' .foo': {bar: 'baz'}
        }}}),

        'p .foo{bar:baz}'
      )
    })

    test('composed selector: add a class to the root', function() {
      check(
        j2c().sheet({'@global': {p: {
          '.foo': {bar: 'baz'}
        }}}),

        'p.foo{bar:baz}'
      )
    })

    test('manual vendor prefixes', function() {
      check(
        j2c().sheet({p: {
          _o$_ms$_moz$_webkit$: {foo: 'bar'}
        }}),

        'p {-o-foo:bar;-ms-foo:bar;-moz-foo:bar;-webkit-foo:bar;foo:bar}'
      )
    })

    test('mixing definitions and sub-selectors', function() {
      check(
        j2c().sheet({'@global': {
          p: {
            foo: 'bar',
            ' .foo': {bar: 'baz'}
          }
        }}),
        'p {foo:bar} p .foo{bar:baz}'
      )
    })



    //////////////////////////////////////////////////
    /**/  suite('Selector Cartesian product: ')  /**/
    //////////////////////////////////////////////////


    test('1 x 2', function() {
      check(
        j2c().sheet({'@global': {p: {
          ' .foo': {
            ':before,:after': {
              foo: 'bar'
            }
          }
        }}}),

        'p .foo:before, p .foo:after {foo:bar}'
      )
    })

    test('2 x 1', function() {
      check(
        j2c().sheet({'@global': {p: {
          ' .foo, .bar': {
            ':before': {
              foo: 'bar'
            }
          }
        }}}),

        'p .foo:before, p .bar:before {foo:bar}'
      )
    })

    test('2 x 2', function() {
      check(
        j2c().sheet({'@global': {p: {
          ' .foo, .bar': {
            ':before,:after': {
              foo: 'bar'
            }
          }
        }}}),

        'p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}'
      )
    })


    test('2 x 3 one of which is empty', function() {
      check(
        j2c().sheet({'@global': {p: {
          ' .foo, .bar': {
            ',:before,:after': {
              foo: 'bar'
            }
          }
        }}}),
        'p .foo, p .bar, p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}'
      )
    })

    test("don't split on comas inside double quoted strings ...", function() {
      check(j2c().sheet({
        'a[foo="bar,baz"]': {
          ' p': {qux: 5}
        }
      }), 'a[foo="bar,baz"] p {qux: 5}')
    })

    test('... nor split on comas inside single quoted strings ...', function() {
      check(j2c().sheet({
        "a[foo='bar,baz']": {
          ' p': {qux: 5}
        }
      }), "a[foo='bar,baz'] p {qux: 5}")
    })

    test('... nor split on comas inside comments ...', function() {
      check(j2c().sheet({
        'a/*bar,baz*/': {
          ' p': {qux: 5}
        }
      }), 'a/*bar,baz*/ p {qux: 5}')
    })

    test('... nor split on comas inside parentheses ...', function() {
      check(j2c().sheet({
        'p:any(a, ul)': {
          ' li': {qux: 5}
        }
      }), 'p:any(a, ul) li {qux: 5}')
    })

    test('... but split in between', function(){
      check(j2c().sheet({
        'a[foo="bar,baz"], a:any(p, ul), a/*bar,baz*/': {
          ' p': {qux: 5}
        }
      }), 'a[foo="bar,baz"] p, a:any(p, ul) p, a/*bar,baz*/ p {qux: 5}')
    })



    /////////////////////////////////
    /**/  suite('Ampersand: ')  /**/
    //////////////////////////////////


    test('.foo &', function() {
      check(
        j2c().sheet({p: {
          ':global(.foo) &': {bar: 'baz'}
        }}),
        '.foo p{bar:baz}'
      )
    })

    test('& &', function() {
      check(
        j2c().sheet({':global(.foo)': {
          '& &': {
            bar: 'baz'
          }
        }}),
        '.foo .foo{bar:baz}'
      )
    })

    test('& [bar="&"].baz', function() {
      check(
        j2c().sheet({':global(.foo)': {
          '& [bar="&"]:global(.baz)': {
            qux: 'quux'
          }
        }}),
        '.foo [bar="&"].baz{qux:quux}'
      )
    })

    test("& [bar='&'].baz", function() {
      check(
        j2c().sheet({':global(.foo)': {
          '& [bar="&"]:global(.baz)': {
            qux: 'quux'
          }
        }}),
        '.foo [bar="&"].baz{qux:quux}'
      )
    })

    test('& /*&*/.baz', function() {
      check(
        j2c().sheet({':global(.foo)': {
          '&  /*&*/:global(.baz)': {
            qux: 'quux'
          }
        }}),
        '.foo /*&*/.baz{qux:quux}'
      )
    })

    test('& &, cartesian product', function() {
      check(
        j2c().sheet({'p,a': {
          '& &': {
            bar: 'baz'
          }
        }}),
        'p p,p a,a p,a a {bar:baz}'
      )
    })

    test('2 x 2', function() {
      check(
        j2c().sheet({p: {
          ' :global(.foo), :global(.bar)': {
            ' :global(.baz) &, :global(.qux)': {
              foo: 'bar'
            }
          }
        }}),
        '.baz p .foo,.baz p .bar,p .foo .qux ,p .bar .qux {foo:bar}'
      )
    })

    test('& in @global context', function() {
      check(
        j2c().sheet({'@global': {
          '.foo': {
            '& &': {
              bar: 'baz'
            }
          }
        }}),
        '.foo .foo{bar:baz}'
      )
    })

    //////////////////////////////////////////
    /**/  suite('Strings and Arrays: ')  /**/
    //////////////////////////////////////////


    test('String literal', function() {
      check(
        j2c().sheet({p: 'foo:bar'}),
        'p{foo:bar}'
      )
    })

    test('String literal with two declarations', function() {
      check(
        j2c().sheet({p: 'foo:bar;baz:qux'}),
        'p {foo:bar;baz:qux}'
      )
    })

    test('String literal starting with an underscore', function() {
      check(
        j2c().sheet({p: '_foo:bar'}),
        'p {_foo:bar}'
      )
    })

    test('Array of String literals', function() {
      check(
        j2c().sheet({p: ['foo:bar', 'foo:baz']}),
        'p{foo:bar;foo:baz}'
      )
    })


    test('overloaded properties', function() {
      check(
        j2c().sheet({p: {
          foo:['bar', 'baz']
        }}),
        'p{foo:bar;foo:baz}'
      )
    })

    test('overloaded sub-properties', function() {
      check(
        j2c().sheet({p: {
          foo:[{bar: 'baz'}, {bar: 'qux'}]
        }}),
        'p{foo-bar:baz;foo-bar:qux}'
      )
    })

    test('nested Arrays', function(){
      check(
        j2c().sheet({p: [
          [
            {bar: 'baz'},
            {bar: 'qux'}
          ],
          'bar:quux;'
        ]}),
        'p{bar:baz;bar:qux;bar:quux}'
      )
    })



    //   ///////////////////////////////////////////
    //  /**/  suite("Sheet auto prefixes: ");  /**/
    // ///////////////////////////////////////////

    // test("String literal", function() {
    //     check(
    //         j2c().sheet({" p": "foo:bar"}, {vendors: ["o", "p"]}),
    //         "p{-o-foo:bar;-p-foo:bar;foo:bar}"
    //     );
    // });

    // test("Array of Strings", function() {
    //     check(
    //         j2c().sheet({" p": ["foo:bar", "_baz:qux"]}, {vendors: ["o", "p"]}),
    //         "p{-o-foo:bar;-p-foo:bar;foo:bar;-o-_baz:qux;-p-_baz:qux;_baz:qux}"
    //     );
    // });



    ////////////////////////////////
    /**/  suite('At-rules: ')  /**/
    ////////////////////////////////


    test('@charset', function() {
      check(
        j2c().sheet({
          '@charset': '"UTF-8"'
        }),

        '@charset "UTF-8";'
      )
    })

    test('@import', function() {
      check(
        j2c().sheet({
          '@import': 'url("bluish.css") projection, tv'
        }),

        '@import url("bluish.css") projection, tv;'
      )
    })

    test('@namespace', function() {
      check(
        j2c().sheet({
          '@namespace': 'prefix url(XML-namespace-URL)'
        }),

        '@namespace prefix url(XML-namespace-URL);'
      )
    })

    test('@media', function() {
      check(
        j2c().sheet({p: {
          '@media foo': {bar: 'baz'}
        }}),

        '@media foo {p{bar:baz}}'
      )
    })

    test('@supports', function() {
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

    test('@page', function() {
      check(
        j2c().sheet({
          '@page :first': {
            margin: '2in 3in'
          }
        }),

        '@page :first {margin: 2in 3in;}'
      )
    })

    test('several @media with object value', function() {
      check(
        j2c().sheet({p: {
          '@media foo': {bar: 'baz'},
          '@media foo2': {bar2: 'baz2'}
        }}),
        [
          '@media foo {p{bar:baz}} @media foo2 {p{bar2:baz2}}'
        ]
      )
    })

    test('Array of @import with text values', function() {
      check(
        j2c().sheet([
          {'@import': "'bar'"},
          {'@import': "'baz'"}
        ]),
        "@import 'bar'; @import 'baz';"
      )
    })

    test('nested @media', function() {
      check(
        j2c().sheet({p: {'@media screen': {width:1000, '@media (max-width: 12cm)': {size:5}}}}),
        [
          '@media screen{p{width:1000}@media (max-width:12cm){p{size:5}}}'
        ]
      )
    })

    test('@font-face', function(){
      check(
        j2c().sheet({'@font-face': {foo: 'bar'}}),
        '@font-face{foo:bar}'
      )
    })

    test('@keyframes', function(){
      check(
        j2c().sheet({'@keyframes global(qux)': {
          from: {foo: 'bar'},
          to: {foo: 'baz'}
        }}),
          '@keyframes qux{from{foo:bar}to{foo:baz}}'
      )
    })

    test('invalid @foo becomes @-error-unsupported-at-rule "@foo"', function(){
      check(
        j2c().sheet({'@foo': 'bar'}),
        '@-error-unsupported-at-rule "@foo";'
      )

    })

    test('invalid @ becomes @-error-unsupported-at-rule "@"', function(){
      check(
        j2c().sheet({'@': 'bar'}),
        '@-error-unsupported-at-rule "@";'
      )

    })

    /////////////////////////////////////////////
    /**/  suite('At-rules with prefixes: ')  /**/
    /////////////////////////////////////////////


    test('@-webkit-keyframes', function(){
      check(
        j2c().sheet({'@-webkit-keyframes global(qux)': {
          from: {foo: 'bar'},
          to: {foo: 'baz'}
        }}),
        '@-webkit-keyframes qux{from{foo:bar}to{foo:baz}}'
      )
    })


    /////////////////////////////////////////////////
    /**/  suite('At-rules with array values: ')  /**/
    /////////////////////////////////////////////////


    test('@font-face with a 1-element array', function(){
      check(
        j2c().sheet({'@font-face':[{foo: 'bar'}]}),
        '@font-face{foo:bar}'
      )
    })

    test('@font-face with a 2-elements array', function(){
      check(
        j2c().sheet({'@font-face':[{foo: 'bar'}, {foo: 'baz'}]}),
        '@font-face{foo:bar}@font-face{foo:baz}'
      )
    })

    test('@namespace with a 1-element array', function(){
      check(
        j2c().sheet({'@namespace': ["'http://foo.example.com'"]}),
        "@namespace 'http://foo.example.com';"
      )
    })

    test('@namespace with a 2-elements array', function(){
      check(
        j2c().sheet({'@namespace': ["'http://foo.example.com'", "bar 'http://bar.example.com'"]}),
        "@namespace 'http://foo.example.com';@namespace bar 'http://bar.example.com';"
      )
    })

    ////////////////////////////
    /**/  suite('@adopt: ')  /**/
    ////////////////////////////

    test('basic usage', function(){
      var _j2c = j2c()
      expect(_j2c.sheet({'@adopt foo': 'bar'})).to.be('')
      expect(_j2c.names).to.have.key('foo')
      expect(_j2c.names.foo).to.be('foo'+_j2c.suffix+' bar')
    })

    test('basic usage (with dots)', function(){
      var _j2c = j2c()
      expect(_j2c.sheet({'@adopt .foo': '.bar'})).to.be('')
      expect(_j2c.names).to.have.key('foo')
      expect(_j2c.names.foo).to.be('foo'+_j2c.suffix+' bar')
    })

    test('array of adoptees', function(){
      var _j2c = j2c()
      expect(_j2c.sheet({'@adopt foo': ['.bar', 'baz']})).to.be('')
      expect(_j2c.names).to.have.key('foo')
      expect(_j2c.names.foo).to.be('foo'+_j2c.suffix+' bar baz')
    })

    test('bad target name', function(){
      var _j2c = j2c()
      check(
        _j2c.sheet({'@adopt /foo': '.bar'}),
        '@-error-bad-at-adopter /foo;'
      )
      expect(_j2c.names).not.to.have.key('/foo')
      expect(_j2c.names).not.to.have.key('foo')

    })

    test('bad parameter name', function(){
      var _j2c = j2c()
      check(
        _j2c.sheet({'@adopt foo': '/bar'}),
        '@-error-bad-at-adoptee "/bar";'
      )
      expect(_j2c.names).not.to.have.key('foo')

    })

    test('forbidden in global scope', function(){
      var _j2c = j2c()
      check(
        _j2c.sheet({'@global':{'@adopt foo': 'bar'}}),
        '@-error-bad-at-adopt-placement "@adopt foo";'
      )
      expect(_j2c.names).not.to.have.key('foo')

    })

    test('forbidden in conditional scope', function(){
      var _j2c = j2c()
      check(
        _j2c.sheet({'@media screen':{'@adopt foo': 'bar'}}),
        '@media screen{@-error-bad-at-adopt-placement "@adopt foo";}'
      )
      expect(_j2c.names).not.to.have.key('foo')

    })


    /////////////////////////////////////
    /**/  suite('Locals, Globals ')  /**/
    /////////////////////////////////////

    test('a local class', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {foo:5}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
    })

    test("a local class in a doubly quoted string shouldn't be localized", function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'[foo=".bit"]': {foo:5}})
      expect(names.bit).to.be(undefined)
      check(css, '[foo=".bit"]{foo:5;}')
    })

    test("a local class in a singly quoted string shouldn't be localized", function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({"[foo='.bit']": {foo:5}})
      expect(names.bit).to.be(undefined)
      check(css, "[foo='.bit']{foo:5;}")
    })

    test("a local class in a comment shouldn't be localized", function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'p/*.bit*/': {foo:5}})
      expect(names.bit).to.be(undefined)
      check(css, 'p/*.bit*/{foo:5;}')
    })

    test('Mixing strings and comments (regexp validation)', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({"/*'*/.bit/*'*/": {foo:5}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      check(css, "/*'*/." + names.bit + "/*'*/{foo:5;}")
    })

    test('two local classes', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {foo:5}, '.bat': {bar:6}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be('bat' + _j2c.suffix)
      expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
      expect(css).to.contain('.' + names.bat + ' {\nbar:6;\n}')
    })

    test('a local and a global class', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {foo:5}, ':global(.bat)': {bar:6}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be(undefined)
      expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
      expect(css).to.contain('.bat {\nbar:6;\n}')
    })

    test('a local wrapping a global block', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {'@global': {'.bat': {foo:5}}}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be(undefined)
      expect(css).to.contain('.' + names.bit + '.bat {\nfoo:5;\n}')
    })

    test('two local classes, nested', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {foo:5, '.bat': {bar:6}}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be('bat' + _j2c.suffix)
      expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
      expect(css).to.contain('.' + names.bit +'.' + names.bat + ' {\nbar:6;\n}')
    })

    test('@keyframes', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'@keyframes bit': {}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(css).to.contain('@keyframes ' + names.bit +' {')
    })

    test('@keyframes with a CSS variable as name', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'@keyframes var(--foo)': {}})
      expect(names).not.to.have.key('var')
      expect(css).to.contain('@keyframes var(--foo) {')
    })

    test('a global @keyframes', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'@keyframes global(bit)': {}})
      expect(names.bit).to.be(undefined)
      expect(css).to.contain('@keyframes bit {')
    })

    test('a @keyframe nested in a @global at-rule', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'@global': {'@keyframes bat': {'from':{foo:6}}}})
      expect(names.bat).to.be(undefined)
      expect(css).to.contain('@keyframes bat {')
    })

    test('one animation', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation: 'bit 1sec'}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(css).to.contain('animation:' + names.bit +' ')
    })

    test('a global animation', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation: 'global(bit) 1sec'}})
      expect(names.bit).to.be(undefined)
      expect(css).to.contain('animation:bit ')
    })

    test('an animation nested in a @global at-rule', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'@global': {p: {animation: 'bit 1sec'}}})
      expect(names.bit).to.be(undefined)
      expect(css).to.contain('animation:bit ')
    })

    test('one animation with a CSS variable', function(){
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation: 'var(--foo) 1sec'}})
      expect(names).not.to.have.key('var')
      expect(css).to.contain('animation:var(--foo) 1sec;')
    })

    test('one animation-name', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation_name: 'bit'}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(css).to.contain('animation-name:' + names.bit +';')
    })

    test('two animation-name', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation_name: 'bit, bat'}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be('bat' + _j2c.suffix)
      expect(css).to.contain('animation-name:' + names.bit +', ' + names.bat)
    })

    test('two animation-name, one global', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation_name: 'bit, global(bat)'}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be(undefined)
      expect(css).to.contain('animation-name:' + names.bit +', bat;')
    })

    test('one animation-name with a CSS variable', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({p: {animation_name: 'var(--foo)'}})
      expect(names).not.to.have.key('var')
      expect(css).to.contain('animation-name:var(--foo);')
    })

    test('a nested @global at-rule', function() {
      var _j2c = j2c(), names = _j2c.names
      var css = _j2c.sheet({'.bit': {'@global': {'.bat': {'foo':6}}}})
      expect(names.bit).to.be('bit' + _j2c.suffix)
      expect(names.bat).to.be(undefined)
      expect(css).to.contain( names.bit +'.bat {')
    })

    test('a @local rule nested in a @global block', function() {
      check(
        j2c().sheet({'@global':{
          '.bit': {
            '@local': {
              ':global(.bat)': {'foo':6}
            }
          }
        }}),
        '.bit.bat {foo:6}'
      )
    })



    ///////////////////////////////////
    /**/  suite('Foolproofing: ')  /**/
    ///////////////////////////////////


    test('property-like sub-selector', function() {
      check(
        j2c().sheet('color:red'),
        ':-error-no-selector {color:red}'
      )
    })
  })


  ////////////////////////////
  /**/  suite('Order: ')  /**/
  ////////////////////////////

  test('two properties', function() {
    check(J2C().sheet({p: {foo: 'bar', baz: 'qux'}}), 'p {\nfoo:bar;\nbaz:qux;\n}')
  })

  test('$ combiner', function() {
    check(J2C().sheet({p: {foo$baz: 'qux'}}), 'p {\nfoo:qux;\nbaz:qux;\n}')
  })

  test('source order is respected when mixing declarations, subselectors and at rules', function(){
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
    o['.' + klass] = {foo:6}
    o['@media (min-width: ' + width + 'em)'] = {bar:7}

    var rules = [
      'p{' + prop + ':5;}',
      'p.' + klass + '{foo:6;}',
      '@media (min-width: ' + width + 'em){p{bar:7;}}'
    ]

    var J2C_1 = J2C()
    // This ensures that we don't rely on the falsy return value of the default
    // buffer methods. This happens here becasue this test harnesses most if not
    // all of the code paths where this may be relevant, especially in
    // `src/sheet.js`
    var J2C_2 = J2C().use({$filter:function (next) {
      return {
        x:next.x,
        i: function() {next.i.apply(next,arguments);return true},
        a: function() {next.a.apply(next,arguments);return true},
        A: function() {next.A.apply(next,arguments);return true},
        d: function() {next.d.apply(next,arguments);return true},
        s: function() {next.s.apply(next,arguments);return true},
        S: function() {next.S.apply(next,arguments);return true}
      }
    }})


    permutations.forEach(function(indices) {
      var source = {p:{}}
      var CSS = []
      indices.forEach(function(i){
        source.p[jsKeys[i]] = o[jsKeys[i]]
        CSS.push(rules[i])
      })
      expect(normalize(J2C_1.sheet({'@global': source}))).to.be(normalize(CSS.join('')))
      expect(normalize(J2C_2.sheet({'@global': source}))).to.be(normalize(CSS.join('')))
    })
  })

  test('@namespace then selector', function() {
    check(J2C().sheet({
      '@namespace': "'foo'",
      p: {foo: 'bar'}
    }), "@namespace 'foo';p{foo:bar;}")
  })



  /////////////////////////////
  /**/  suite('Extras: ')  /**/
  /////////////////////////////

  test('J2C.kv()', function() {
    expect(J2C.kv).to.be.a(Function)
    expect(J2C().kv).to.be.a(Function)
    expect(J2C.kv).to.be(J2C().kv)
    var o = J2C.kv('k','v')
    expect(o).to.have.key('k')
    expect(o.k).to.be('v')
  })

  test('J2C.global()', function() {
    expect(J2C.global).to.be.a(Function)
    expect(J2C().global).to.be.a(Function)
    expect(J2C.global).to.be(J2C().global)
    expect(J2C.global('foo')).to.be(':global(foo)')
  })

  test('J2C.at(), basics', function() {
    expect(J2C.at).to.be.a(Function)
    expect(J2C().at).to.be.a(Function)
    expect(J2C.at).to.be(J2C().at)
  })

  test('J2C.at(), as an object key', function() {
    expect(J2C.at('foo', 'bar') + '').to.be('@foo bar')
  })

  test('J2C.at(), as an object key, curried', function() {
    expect(J2C.at('foo')('bar') + '').to.be('@foo bar')
    expect(J2C.at()('foo')('bar') + '').to.be('@foo bar')
    expect(J2C.at('foo')()('bar') + '').to.be('@foo bar')
    expect(J2C.at('foo')('bar')() + '').to.be('@foo bar')
  })

  test('J2C.at(), as an object generator', function() {
    var atFoo = J2C.at('foo', 'bar', {baz:'qux'})
    expect(atFoo).to.have.key('@foo bar')
    expect(atFoo['@foo bar']).to.be.an(Object)
    expect(atFoo['@foo bar']).to.have.key('baz')
    expect(atFoo['@foo bar'].baz).to.be('qux')
  })

  test('J2C.at(), as an object generator, curried 1', function() {
    var atFoo = J2C.at('foo')('bar', {baz:'qux'})
    expect(atFoo).to.have.key('@foo bar')
    expect(atFoo['@foo bar']).to.be.an(Object)
    expect(atFoo['@foo bar']).to.have.key('baz')
    expect(atFoo['@foo bar'].baz).to.be('qux')
  })

  test('J2C.at(), as an object generator, curried 2', function() {
    var atFoo = J2C.at('foo', 'bar')({baz:'qux'})
    expect(atFoo).to.have.key('@foo bar')
    expect(atFoo['@foo bar']).to.be.an(Object)
    expect(atFoo['@foo bar']).to.have.key('baz')
    expect(atFoo['@foo bar'].baz).to.be('qux')
  })

  test('J2C.at(), as an object generator, curried 3', function() {
    var atFoo = J2C.at('foo')('bar')({baz:'qux'})
    expect(atFoo).to.have.key('@foo bar')
    expect(atFoo['@foo bar']).to.be.an(Object)
    expect(atFoo['@foo bar']).to.have.key('baz')
    expect(atFoo['@foo bar'].baz).to.be('qux')
  })



  //////////////////////////////
  /**/  suite('Plugins: ')  /**/
  //////////////////////////////

  test('an empty array as plugin', function() {
    check(
      J2C().use([]).sheet({p:{color:'red'}}),
      'p{color:red;}'
    )
  })

  test('an null plugin', function() {
    check(
      J2C().use(null).sheet({p:{color:'red'}}),
      'p{color:red;}'
    )
  })

  test('an invalid $plugin', function() {
    var _J2C = J2C().use({$invalid:'foo'})
    check(
      _J2C.sheet({p:{color:'red'}}),
      'p{color:red;}'
    )
    expect(_J2C).not.to.have.key('$invalid')
  })

  test('a plugin that sets a property on the instance', function() {
    var _J2C = J2C().use({testProp:'foo'})
    check(
      _J2C.sheet({p:{color:'red'}}),
      'p{color:red;}'
    )
    expect(_J2C).to.have.key('testProp')
    expect(_J2C.testProp).to.be('foo')
  })

  test('a plugin that sets a property on the instance that already exists', function() {
    var _J2C = J2C().use({sheet:'foo'})
    expect(_J2C.sheet).not.to.be('foo')
    check(
      _J2C.sheet({p:{color:'red'}}),
      'p{color:red;}'
    )

    expect(_J2C.sheet).not.to.be('foo')
  })

  test('Plugin deduplication', function() {
    var p = {}
    var _J2C = J2C().use(p, p)
    expect(_J2C.$plugins.length).to.be(1)
  })

  ////////////////////////////////////////////////////
  /**/  suite('names plugins for J2C.inline()')  /**/
  ////////////////////////////////////////////////////

  test('namespaced animation', function() {
    check(
      J2C().use(
        {$names: {foo:'theFoo'}}
      ).inline(
        {animation:'foo 1sec'}
      ),
      'animation:theFoo 1sec;'
    )
  })

  test('namespaced animation-name', function() {
    check(
      J2C().use(
        {$names: {foo:'theFoo'}}
      ).inline(
        {animation_name:'foo'}
      ),
      'animation-name:theFoo;'
    )
  })

  test('namespaced and non-namespaced animation-name', function() {
    var _J2C = J2C().use({$names: {foo:'theFoo'}})
    var result = _J2C.inline({animation_name:'foo, bar'})
    check(
      result,
      'animation-name:theFoo, ' + _J2C.names.bar + ';'
    )
  })

  test('two namespaced animations', function() {
    var result = J2C().use(
      {$names: {foo:'theFoo', bar:'theBar'}}
    ).inline(
      {animation:'foo 1sec, bar 2sec'}
    )
    check(
      result,
      'animation:theFoo 1sec, theBar 2sec;'
    )
  })



  ///////////////////////////////////////////////////
  /**/  suite('names plugins for J2C.sheet()')  /**/
  ///////////////////////////////////////////////////

  test('namespaced class', function() {
    var _J2C = J2C().use({$names: {foo: 'FOOO'}}), names = _J2C.names
    var css = _J2C.sheet(
      {'.foo': {foo: 'bar', baz: 'qux'}}
    )
    check('' + css, '.FOOO{foo:bar;baz:qux;}')
    expect(names.foo).to.be('FOOO')
  })

  test('namespaced class wrapping a global block', function() {
    var _J2C = J2C().use({$names: {foo: 'FOOO'}}), names = _J2C.names
    var css = _J2C.sheet(
      {'.foo': {'@global': {'.foo': {foo: 'bar', baz: 'qux'}}}}
    )
    check('' + css, '.FOOO.foo{foo:bar;baz:qux;}')
    expect(names.foo).to.be('FOOO')
  })

  test('namespaced @keyframes', function(){
    var _J2C = J2C().use({$names: {bit: 'BOT'}}), names = _J2C.names
    var css = _J2C.sheet(
        {'@keyframes bit': {}}
      )
    expect(names.bit).to.be('BOT')
    expect(css).to.contain('@keyframes BOT {')
  })

  test('namespaced animation', function(){
    var _J2C = J2C().use({$names: {bit: 'BOT'}}), names = _J2C.names
    var css = _J2C.sheet(
        {p: {animation: 'bit 1sec'}}
      )
    expect(names.bit).to.be('BOT')
    check(css, 'p{animation:BOT 1sec;}')
  })

  test('namespaced animation-name', function() {
    var _J2C = J2C().use({$names: {bit: 'BOT'}}), names = _J2C.names
    var css = _J2C.sheet({p: {animation_name: 'bit'}})
    expect(names.bit).to.be('BOT')
    check(css, 'p{animation-name:BOT;}')
  })

  test("don't overwrite an existing name", function() {
    var _J2C = J2C().use({$names: {bit: 'BOT'}}, {names: {bit: 'BUT'}}), names = _J2C.names
    expect(names.bit).to.be('BOT')
  })



  ////////////////////////////////////
  /**/  suite('$filter plugins')  /**/
  ////////////////////////////////////


  test('a sheet filter', function() {
    function filter(J2C) {
      expect(J2C).to.be.an(Object)
      expect(J2C.sheet).to.be.a(Function)

      return {$filter: function(next, inline) {
        expect(next).to.be.an(Object)
        expect(next.i).to.be.a(Function)
        expect(next.x).to.be.a(Function)
        expect(next.d).to.be.a(Function)
        if(!inline) {
          expect(next.s).to.be.a(Function)
          expect(next.S).to.be.a(Function)
          expect(next.a).to.be.a(Function)
          expect(next.A).to.be.a(Function)
        }

        return {
          x: function() {
            var buf = next.x(1)
            expect(buf).to.be.an(Array)
            expect(buf.length).not.to.be(0)
            var txt = next.x()
            expect(txt).to.be.a('string')
            return txt
          },
          i: function() {
            next.i()
            expect(!!inline).to.be(false)
          },
          a: function(name, arg, hasBlock) {
            next.a(name+'o', 'a'+arg, hasBlock)
          },
          A: function(name, arg) {
            next.A(name+'o', 'a'+arg)
          },
          d: function(prop, value) {
            next.d('p'+prop, 'v'+value)
          },
          s: function(selector) {
            next.s('h1, ' + selector)
          },
          S: function(selector) {
            next.S('h1, ' + selector)
          }
        }
      }}
    }
    check(
      J2C().use(filter).sheet({'@global': {
        '@import': 'foo',
        p: {foo: 'bar'},
        '@keyframes foo': {from:{foo:'baz'}}
      }}),
      '@importo afoo;' +
      'h1, p {pfoo:vbar}' +
      '@keyframeso afoo{h1, from{pfoo:vbaz}}'
    )
  })

  test('a declaration filter', function() {
    function filter(J2C) {
      expect(J2C).to.be.an(Object)
      expect(J2C.inline).to.be.a(Function)

      return {$filter: function(next, inline) {
        expect(next).to.be.an(Object)
        expect(next.i).to.be.a(Function)
        expect(next.x).to.be.a(Function)
        expect(next.d).to.be.a(Function)
        if(!inline) {
          expect(next.s).to.be.a(Function)
          expect(next.S).to.be.a(Function)
          expect(next.a).to.be.a(Function)
          expect(next.A).to.be.a(Function)
        }

        return {
          x: function() {
            var buf = next.x(true)
            expect(buf).to.be.an(Array)
            expect(buf.length).not.to.be(0)
            var txt = next.x()
            expect(txt).to.be.a('string')
            return txt
          },
          i: function() {
            next.i()
            expect(!!inline).to.be(true)
          },
          d: function(prop, value) {
            next.d('p'+prop, 'v'+value)
          }
        }
      }}
    }
    check(
      J2C().use(filter).inline({foo:'bar'}),
      'pfoo:vbar;'
    )
  })

  test('filter order', function() {
    var acc = []
    function filter(x) {
      return {$filter: function(next) {
        return {
          i: next.i,
          x: next.x,
          a: next.a,
          A: next.A,
          d: next.d,
          s: function(){
            acc.push(x)
            return next.s.apply(next, arguments)
          },
          S: next.S
        }
      }}
    }
    J2C().use(filter(1), filter(2)).sheet({'.foo': 'bar:baz;'})
    expect(acc.length).to.be(2)
    expect(acc[0]).to.be(1)
    expect(acc[1]).to.be(2)
  })

  test('filter dedupe', function() {
    var acc = []
    function filter(x) {
      return {$filter: function(next) {
        return {
          i: next.i,
          x: next.x,
          a: next.a,
          A: next.A,
          d: next.d,
          s: function(){
            acc.push(x)
            next.s.apply(next, arguments)
          },
          S: next.S
        }
      }}
    }
    var f = filter(1)
    J2C().use(f, f).sheet({'.foo': 'bar:baz;'})
    expect(acc.length).to.be(1)
    expect(acc[0]).to.be(1)
  })

  ////////////////////////////////////
  /**/  suite('$at plugins')  /**/
  ////////////////////////////////////


  test('one $at plugin', function() {
    function plugin(name) {
      return {$at: function(parser, emit, match, v, prefix, local, inAtRule){
        expect(match).to.be.an(Array)
        expect(parser).to.be.an(Object)
        expect(parser).to.have.key('$a')
        expect(parser).to.have.key('a')
        expect(parser).to.have.key('d')
        expect(parser).to.have.key('l')
        expect(parser).to.have.key('n')
        expect(parser).to.have.key('s')

        expect(emit).to.be.an(Object)
        expect(emit).to.have.key('a')

        expect(v).to.be('param')

        expect(prefix).to.be.a('string')
        // `local` can be many things, the only things that matters is its truthiness
        expect(!!local).to.be(true)
        // `inAtRule` can be many things, the only things that matters is its truthiness
        expect(!!inAtRule).to.be(false)

        if (match[2] !== name) return false
        emit.a(match[1], v)
        return true
      }}
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

  test('two $at plugins', function() {
    function plugin(name) {
      return {$at: function(parser, emit, match, v){
        if (match[2] !== name) return false
        emit.a(match[1], v)
        return true
      }}
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

  test('$at plugin has precedence over default at-rules', function() {
    var plugin = {$at: function(parser, emit, match, v){
      if (match[2] !== 'import') return false
      emit.a('@intercepted', v)
      return true
    }}

    check(
      J2C().use(plugin).sheet({
        '@import': 'foo'
      }),
      '@intercepted foo;'
    )
  })

  test('$at plugin that verifies malformed rules are properly passed unparsed', function() {
    var plugin = {$at: function(parser, emit, match, v){

      expect(match[0]).to.be('@; hey')
      expect(match[1]).to.be('@')
      expect(match[2]).to.be('')
      expect(match[3]).to.be('')
      expect(v).to.be('foo')
      return true
    }}

    check(
      J2C().use(plugin).sheet({
        '@; hey': 'foo'
      }),
      ''
    )
  })
}) // DONE!





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
// - test the `parser` object from within $at and $filter plugins
//
// - verify that custom at rules take precedence over default ones
//
// - test @keyframes nested in selector scope
//
// - Attach new properties using `.use()`. Verify that old ones are not
//   overwritten
