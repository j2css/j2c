/*eslint-env node, mocha */

// used to normalize styles for reliable comparison.
var expect = require('expect.js'),
  minifySelectors = require('postcss-minify-selectors'),
  minifyParams = require('postcss-minify-params'),
  perfectionist = require('perfectionist'),
  postcss = require('postcss')([perfectionist({format:'compressed'}), minifySelectors(), minifyParams()])



function normalize(s) { return postcss.process(s).css }

function check(result, expected){
  result = normalize(result)

    // since you can't rely on the order of JS object keys, sometimes, several "expected"
    // values must be provided.
  // expected = (expected instanceof Array ? expected : [expected]).map(function(s){
  //   return normalize(s)
  // })
  expect(normalize(expected)).to.contain(result)
}

function randStr() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
}
function randInt() {
  return Math.random().toString().substr(2, 3)
}

function webkitify(decl) {return '-webkit-' + decl + '\n' + decl}

[
  '../dist/j2c.commonjs',
  '../dist/j2c.commonjs.min'
  // ,
  // '../dist/inline/j2c.commonjs',
  // '../dist/inline/j2c.commonjs.min'
].forEach(function(lib){
  var j2c = require(lib)

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

  test('two properties', function() {
    checkinline(
      {foo: 'bar', baz: 'qux'},
      'foo:bar;baz:qux;'
    )
  })

  test('two properties, ensure order', function() {
    check(j2c().inline({foo: 'bar', baz: 'qux'}), 'foo:bar;\nbaz:qux;')
  })


  test('array of values', function() {
    checkinline(
      {foo:['bar', 'baz']},
      'foo:bar;foo:baz;'
    )
  })

  test('sub-properties', function(){
    checkinline(
      {foo: {bar: 'baz'}},
      'foo-bar:baz;'
    )
  })

  test('multiple sub-properties', function(){
    checkinline(
      {foo: {bar$qux: 'baz'}},
      'foo-bar:baz;foo-qux:baz;'
    )
  })

  test('multiple sub-properties, ensure order', function() {
    check(j2c().inline({foo$baz: 'qux'}), 'foo:qux;\nbaz:qux;')
  })



  test('multiple sub-properties with a sub-sub-property', function(){
    checkinline(
      {foo: {bar$baz: {qux: 'quux'}}},
      'foo-bar-qux:quux;foo-baz-qux:quux;'
    )
  })

  test('multiple sub-properties with two sub-sub-properties', function(){
    checkinline(
      {foo: {bar$baz: {qux$quux: 'fred'}}},
      'foo-bar-qux:fred;foo-bar-quux:fred;foo-baz-qux:fred;foo-baz-quux:fred;'
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
    check(j2c().inline({'*foo': 'bar'}), '*foo:bar;')
  })

  test('CSS _Hack', function() {
    checkinline(
      ['_foo:bar', {_baz: 'qux'}],
      '_foo:bar;-baz:qux;'
    )
  })

  test('custom obj.valueOf', function() {
    var bar = {valueOf:function(){return 'bar'}}
    checkinline(
      {foo:bar},
      'foo:bar;'
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

  test('null value', function() {
    checkinline(
      null,
      ''
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

  ////////////////////////////////////////
  /**/  suite('Inline namespaces: ')  /**/
  ////////////////////////////////////////

  test('namespaced animation', function() {
    var result = j2c({names: {foo:'theFoo'}}).inline({animation:'foo 1sec'})
    check(result, webkitify('animation:theFoo 1sec;'))
  })

  test('namespaced animation-name', function() {
    var result = j2c({names: {foo:'theFoo'}}).inline({animation_name:'foo'})
    check(result, webkitify('animation-name:theFoo;'))
  })

  test('namespaced and non-namespaced animation-name', function() {
    var _j2c = j2c({names: {foo:'theFoo'}})
    var result = _j2c.inline({animation_name:'foo, bar'})
    check(result, webkitify('animation-name:theFoo, ' + _j2c.names.bar + ';'))
  })

  test('two namespaced animations', function() {
    var result = j2c(
      {names: {foo:'theFoo', bar:'theBar'}}
    ).inline(
      {animation:'foo 1sec, bar 2sec'}
    )
    check(result, webkitify('animation:theFoo 1sec, theBar 2sec;'))
  })



  /////////////////////////////////////
  /**/  suite('Inline plugins: ')  /**/
  /////////////////////////////////////

  test('one plugin that does nothing', function() {
    check(j2c().use({postprocess: function(){}}).inline(
      {foo: 'bar'}
    ), 'foo:bar;')
  })

  test('one plugin that mutates the buffer', function() {
    check(j2c().use(
      {postprocess: function(buf){
        buf[0] = buf[0].replace('f','k')
      }}
    ).inline(
      {foo: 'bar'}
    ), 'koo:bar;')
  })

  test('one plugin that returns a new buffer', function() {
    expect(j2c().use(
      {postprocess: function(){
        return ['hello:world;']
      }}
    ).inline(
      {foo: 'bar'}
    )).to.be('hello:world;')
  })

  test('two plugins that mutate the buffer', function() {
    check(j2c().use(
      {postprocess: function(buf){
        buf[0]=buf[0].replace('f', 'a')
      }},
      {postprocess: function(buf){
        buf[0]=buf[0].replace('a', 'm')
      }}
    ).inline(
      {foo: 'bar'}
    ), 'moo:bar;')
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
      j2c().sheet({'@global': {p: {
        foo: 'bar',
        ' .foo': {bar: 'baz'}
      }}}),

      ['p .foo{bar:baz} p {foo:bar}', 'p {foo:bar} p .foo{bar:baz}']
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

  test("don't split on comas inside strings ...", function() {
    check(j2c().sheet({
      'a[foo="bar,baz"]': {
        ' p': {qux: 5}
      }
    }), 'a[foo="bar,baz"] p {qux: 5}')
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
      'a:any(p, ul)': {
        ' p': {qux: 5}
      }
    }), 'a:any(p, ul) p {qux: 5}')
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


  test('composed selector: add a class to the root', function() {
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
      'p{foo:bar}p{foo:baz}'
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
      'p{bar:baz}p{bar:qux}p{bar:quux}'
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


  test('standard at-rule with text value', function() {
    check(
      j2c().sheet({p: {
        '@import': "'bar'"
      }}),

      "@import 'bar';"
    )
  })

  test('standard at-rule with object value', function() {
    check(
      j2c().sheet({p: {
        '@media foo': {bar: 'baz'}
      }}),

      '@media foo {p{bar:baz}}'
    )
  })

  test('several at-rules with object value', function() {
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

  test('Array of at-rules with text values', function() {
    check(
      j2c().sheet({p: [
        {'@import': "'bar'"},
        {'@import': "'baz'"}
      ]}),
      "@import 'bar'; @import 'baz';"
    )
  })

  test('nested at-rules', function() {
    check(
      j2c().sheet({p: {'@media screen': {width:1000, '@media (max-width: 12cm)': {size:5}}}}),
      [
        '@media screen{p{width:1000}@media (max-width:12cm){p{size:5}}}'
      ]
    )
  })

  test('@font-face', function(){
    check(
      j2c().sheet({p: {'@font-face': {foo: 'bar'}}}),
      '@font-face{foo:bar}'
    )
  })

  test('@keyframes', function(){
    check(
      j2c().sheet({p: {'@keyframes :global(qux)': {
        ' from': {foo: 'bar'},
        ' to': {foo: 'baz'}
      }}}),
      '@-webkit-keyframes qux{from{-webkit-foo:bar;foo:bar}to{-webkit-foo:baz;foo:baz}}' +
        '@keyframes qux{from{foo:bar}to{foo:baz}}'
    )
  })

  test('invalid @foo becomes at-foo property', function(){
    check(
      j2c().sheet({'@foo': 'bar'}),
      '@-error-unsupported-at-rule "@foo";'
    )

  })

  //////////////////////////////////////////////////
  /**/  suite('At-rules with array values: ')  /**/
  //////////////////////////////////////////////////


  test('@font-face with a 1-element array', function(){
    check(
      j2c().sheet({p: {'@font-face':[{foo: 'bar'}]}}),
      '@font-face{foo:bar}'
    )
  })

  test('@font-face with a 2-elements array', function(){
    check(
      j2c().sheet({p: {'@font-face':[{foo: 'bar'}, {foo: 'baz'}]}}),
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

  /////////////////////////////////////
  /**/  suite('Locals, Globals ')  /**/
  /////////////////////////////////////


  test('a local class', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {foo:5}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
  })

  test('two local classes', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {foo:5}, '.bat': {bar:6}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bit.slice(4)).to.be(names.bat.slice(4))
    expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
    expect(css).to.contain('.' + names.bat + ' {\nbar:6;\n}')
  })

  test('a local and a global class', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {foo:5}, ':global(.bat)': {bar:6}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bat).to.be(undefined)
    expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
    expect(css).to.contain('.bat {\nbar:6;\n}')
  })

  test('a local wrapping a global block', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {'@global': {'.bat': {foo:5}}}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bat).to.be(undefined)
    expect(css).to.contain('.' + names.bit + '.bat {\nfoo:5;\n}')
  })

  test('two local classes, nested', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {foo:5, '.bat': {bar:6}}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bit.slice(4)).to.be(names.bat.slice(4))
    expect(css).to.contain('.' + names.bit + ' {\nfoo:5;\n}')
    expect(css).to.contain('.' + names.bit +'.' + names.bat + ' {\nbar:6;\n}')
  })

  test('@keyframes', function(){
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'@keyframes bit': {}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(css).to.contain('@keyframes ' + names.bit +' {')
  })

  test('a global @keyframes', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'@keyframes :global(bit)': {}})
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
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(css).to.contain('animation:' + names.bit +' ')
  })

  test('a global animation', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({p: {animation: ':global(bit) 1sec'}})
    expect(names.bit).to.be(undefined)
    expect(css).to.contain('animation:bit ')
  })

  test('an animation nested in a @global at-rule', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'@global': {p: {animation: 'bit 1sec'}}})
    expect(names.bit).to.be(undefined)
    expect(css).to.contain('animation:bit ')
  })

  test('one animation-name', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({p: {animation_name: 'bit'}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(css).to.contain('animation-name:' + names.bit +';')
  })

  test('two animation-name', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({p: {animation_name: 'bit, bat'}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bit.slice(4)).to.be(names.bat.slice(4))
    expect(css).to.contain('animation-name:' + names.bit +', ' + names.bat)
  })

  test('two animation-name, one global', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({p: {animation_name: 'bit, :global(bat)'}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bat).to.be(undefined)
    expect(css).to.contain('animation-name:' + names.bit +', bat;')
  })

  test('a nested @global at-rule', function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit': {'@global': {'.bat': {'foo':6}}}})
    expect(names.bit.slice(0, 9)).to.be('bit__j2c-')
    expect(names.bat).to.be(undefined)
    expect(css).to.contain( names.bit +'.bat {')
  })


  ///////////////////////////////////
  /**/  suite('Foolproofing: ')  /**/
  ///////////////////////////////////



  test('property-like sub-selector', function() {
    var sheet = j2c().sheet({'.foo': {'g,p': {animation_name: 'bit, bat'}}})

    expect(sheet).to.contain(':-error-bad-sub-selector-g,:-error-bad-sub-selector-p')
  })


  ////////////////////////////
  /**/  suite('Order: ')  /**/
  ////////////////////////////

  test('two properties', function() {
    check(j2c().sheet({p: {foo: 'bar', baz: 'qux'}}), 'p {\nfoo:bar;\nbaz:qux;\n}')
  })

  test('$ combiner', function() {
    check(j2c().sheet({p: {foo$baz: 'qux'}}), 'p {\nfoo:qux;\nbaz:qux;\n}')
  })


    // This was built with the assumption that
    // objects are totally unordered which isn't true in JS
    // As long as no properties are deleted and created again,
    // the insertion order is the iteration order in all
    // browsers and in node too.
  test('subselector > declaration > @media', function(){
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

    permutations.forEach(function(indices) {
      var source = {p:{}}
      var CSS = []
      indices.forEach(function(i){
        source.p[jsKeys[i]] = o[jsKeys[i]]
        CSS.push(rules[i])
      })
      expect(normalize(j2c().sheet({'@global': source}))).to.be(normalize(CSS.join('')))
    })


  })

  test('@namespace then selector', function() {
    check(j2c().sheet({
      '@namespace': "'foo'",
      p: {foo: 'bar'}
    }), "@namespace 'foo';p{foo:bar;}")
  })

  /////////////////////////////////
  /**/  suite('Namespaces: ')  /**/
  /////////////////////////////////

  test('namespaced class', function() {
    var _j2c = j2c({names: {foo: 'FOOO'}}), names = _j2c.names
    var css = _j2c.sheet(
      {'.foo': {foo: 'bar', baz: 'qux'}}
    )
    check('' + css, '.FOOO{foo:bar;baz:qux;}')
    expect(names.foo).to.be('FOOO')
  })

  test('namespaced class wrapping a global block', function() {
    var _j2c = j2c({names: {foo: 'FOOO'}}), names = _j2c.names
    var css = _j2c.sheet(
      {'.foo': {'@global': {'.foo': {foo: 'bar', baz: 'qux'}}}}
    )
    check('' + css, '.FOOO.foo{foo:bar;baz:qux;}')
    expect(names.foo).to.be('FOOO')
  })

  test('namespaced @keyframes', function(){
    var _j2c = j2c({names: {bit: 'BOT'}}), names = _j2c.names
    var css = _j2c.sheet(
        {'@keyframes bit': {}}
      )
    expect(names.bit).to.be('BOT')
    expect(css).to.contain('@keyframes BOT {')
  })

  test('namespaced animation', function(){
    var _j2c = j2c({names: {bit: 'BOT'}}), names = _j2c.names
    var css = _j2c.sheet(
        {p: {animation: 'bit 1sec'}}
      )
    expect(names.bit).to.be('BOT')
    check(css, 'p{' + webkitify('animation:BOT 1sec;') + '}')
  })

  test('namespaced animation-name', function() {
    var _j2c = j2c({names: {bit: 'BOT'}}), names = _j2c.names
    var css = _j2c.sheet({p: {animation_name: 'bit'}})
    expect(names.bit).to.be('BOT')
    check(css, 'p{' + webkitify('animation-name:BOT;') + '}')
  })

  /////////////////////////////
  /**/  suite('extend: ')  /**/
  /////////////////////////////

  test('local extend', function() {
    var _j2c = j2c(), names = _j2c.names
    _j2c.sheet({'.bit': {'@extend':'.bat'}})
    expect(names.bit).to.contain('bit__j2c-')
    expect(names.bat).to.contain('bat__j2c-')
    expect(names.bat).not.to.contain('bit__j2c-')
    expect(names.bit).to.contain(names.bat + ' ')
  })

  test('global extend', function() {
    var _j2c = j2c(), names = _j2c.names
    _j2c.sheet({'.bit': {'@extend':':global(.bat)'}})
    expect(names.bit).to.contain('bit__j2c-')
    expect(names.bit).to.contain('bat ')
  })

  test('two local extends', function() {
    var _j2c = j2c(), names = _j2c.names
    _j2c.sheet({'.bit': {'@extends':['.bat', '.bot']}})
    expect(names.bit).to.contain('bit__j2c-')
    expect(names.bat).to.contain('bat__j2c-')
    expect(names.bot).to.contain('bot__j2c-')
    expect(names.bat).not.to.contain('bit__j2c-')
    expect(names.bot).not.to.contain('bit__j2c-')
    expect(names.bit).to.contain(names.bat + ' ' + names.bot + ' ')
  })

  test('extend applies only to the last class in the selector', function() {
    var _j2c = j2c(), names = _j2c.names
    _j2c.sheet({'.bot p .bit': {'@extend':'.bat'}})
    expect(names.bit).to.contain('bit__j2c-')
    expect(names.bat).to.contain('bat__j2c-')
    expect(names.bot).to.contain('bot__j2c-')
    expect(names.bat).not.to.contain('bit__j2c-')
    expect(names.bit).to.contain(names.bat + ' ')
    expect(names.bot).not.to.contain(names.bat + ' ')
  })

  test("if we can't find a class to extend, pass @extend as a property", function() {
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'p > a': {'@extend':'.bat'}})
    expect(names.bat).to.be(undefined)
    expect(css).to.contain('@-error-no-class-to-extend-in "p > a";')
  })

  test("extend doesn't extend into global selectors", function() {
    // @extend thus extends the last local class in the stream
    var _j2c = j2c(), names = _j2c.names
    var css = _j2c.sheet({'.bit :global(.bot)': {'@extend':'.bat'}})
    expect(names.bit).to.contain('bit__j2c-')
    expect(names.bat).to.be(undefined)
    expect(names.bot).to.be(undefined)
    expect(names.bit).not.to.contain(names.bat + ' ')
    expect('' + css).to.contain('@-error-cannot-extend-in-global-context ".bit :global(.bot)";')
  })

  //////////////////////////////
  /**/  suite('Plugins: ')  /**/
  //////////////////////////////

  test('one plugin that does nothing', function() {
    check(j2c().use({postprocess: function(){}}).sheet(
      {p: {foo: 'bar'}}
    ), 'p{foo:bar;}')
  })

  test('one plugin that mutates the buffer', function() {
    check(j2c().use(
      {postprocess: function(buf){
        buf[0] = 'li'
      }}
    ).sheet(
      {p: {foo: 'bar'}}
    ), 'li{foo:bar;}')
  })

  test('one plugin that returns a new buffer', function() {
    check(j2c().use(
      {postprocess: function(){
        return ['li{foo:bar;}']
      }}
    ).sheet(
      {p: {foo: 'bar'}}
    ), 'li{foo:bar;}')
  })

  test('two plugins that mutate the buffer', function() {
    check(j2c().use(
      {postprocess: function(buf){
        buf[0]=buf[0].replace('p', 'a')
      }},
      {postprocess: function(buf){
        buf[0]=buf[0].replace('a', 'i')
      }}
    ).sheet(
      {p: {fop: 'bar'}}
    ), 'i{fop:bar;}')
  })
})

// TODO
// test .use
// test the default `j2c` instance as well

