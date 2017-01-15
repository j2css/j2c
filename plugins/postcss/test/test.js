var postcss = require('postcss')
var o = require('mithril/ospec/ospec')
var j2c = require('../../..')
var j2cPostcss = require('../')

var autoprefixer = require('autoprefixer')

var plugin = j2cPostcss(postcss.plugin('plugin', function () {
  return function (css) {
    css.walk(function(node){
      if (node.type === 'atrule' && node.params) node.params += 'WAT'
      if (node.type === 'rule') node.selector += ', .postcss'
      if (node.type === 'decl') node.value += 'ish'
    })
  }
}))

o('modify inline styles', function(){
  o(j2c(plugin)
        .inline({color:'red'})
    ).equals('color:redish;\n')
})

o('modify a full sheet', function(){
  o(j2c(plugin)
        .sheet({
          '@namespace': 'foo',
          '@media bar':{p:{color:'red'}}
        })
    ).equals('\
@namespace fooWAT;\n\
@media barWAT {\n\
p, .postcss {\n\
color:redish;\n\
}\n\
}\n'
    )
})

o('leave raw declatarion as is', function(){
  o(j2c(plugin)
        .sheet({
          '@namespace': 'foo',
          '@media bar':{p:'color:red'}
        })
    ).equals('\
@namespace fooWAT;\n\
@media barWAT {\n\
p, .postcss {\n\
color:red\n\
}\n\
}\n'
    )
})


o('use autoprefixer to remove prefixes', function(){
  o(j2c(j2cPostcss(autoprefixer({ add: false, browsers: [] }))).sheet({'@global':{
    '@-webkit-keyframes foo': {from:{color:'red'}, to:{color:'pink'}},
    '@keyframes bar': {from:{color:'red'}, to:{color:'pink'}}
  }})).equals('\
@keyframes bar {\n\
from {\n\
color:red;\n\
}\n\
to {\n\
color:pink;\n\
}\n\
}\n'
    )
})

o('use the $postcss field to concatenate plugins into as single postCSS processor', function(){
  var plugins = {}
  function makePlugin(name){
    return j2cPostcss(postcss.plugin(name, function () {
      return function(css, result){
        plugins[name] = result.processor.plugins
      }
    }))
  }
  j2c(makePlugin('before'), plugin, makePlugin('after')).sheet({})
  o(plugins.before).equals(plugins.after)
  o(plugins.before[0].postcssPlugin).equals('before')
  o(plugins.before[2].postcssPlugin).equals('after')
})

// ------------

o.run()