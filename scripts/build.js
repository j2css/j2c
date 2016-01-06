#! /usr/bin/env node

/*eslint-env node*/
/*eslint no-console: 0*/

var fs = require('fs'),
  rollup = require('rollup'),
  uglify = require('uglify-js'),
  zlib = require('zlib'),
  outputs = [
    {
      rollupOptions:{
        format: 'iife',
        moduleName: 'j2c'
      },
      name: 'global',
      minify: {saveGzip:true}
    },
    {
      rollupOptions:{
        format: 'cjs'
      },
      name: 'commonjs',
      minify: {save:true}
    },
    { // not sure this one is necessary by now...
      rollupOptions:{
        format: 'es6'
      },
      name: 'es6',
      minify: false // ATM, uglify chokes on the export statement.
    },
    {
      rollupOptions:{
        format: 'amd',
        name: 'j2c'
      },
      name: 'amd',
      minify: {save:true}
    }
  ]

var parsed = rollup.rollup({
  entry: 'src/main.js'
})


outputs.forEach(function (output) {
  parsed.then(function(bundle){
    var result = bundle.generate(output.rollupOptions)
    fs.writeFileSync('dist/j2c.' + output.name + '.js', result.code)
    if (output.minify) {
      var minified = uglify.minify(result.code, {
        fromString: true,
        mangle: true,
        compress: {}
      }).code
      fs.writeFileSync('dist/j2c.' + output.name + '.min.js', minified)
      zlib.gzip(minified, function(_, buf){
        console.log(output.name, _ || buf.length)
        if (output.minify.saveGzip) {
          fs.writeFileSync('dist/j2c.' + output.name + '.min.js.gz', buf)
        }
      })
    }
  }).then(null, function (e) {console.log(output.name, e)})

//     if (wrappers[wrp].minify) {
// /*jshint -W083 */
//         (function(){
//             var minified = uglify.minify(
//                 wrapped, {fromString: true}).code,
//                 _name = name,
//                 _wrp = wrp;

//             fs.writeFileSync('dist/' + name + '.' + wrp + '.min.js', minified);
//             zlib.gzip(minified, function(_, buf){
//                 console.log(_name+'.'+_wrp, _ || buf.length);
//             });
//         })();
// /*jshint +W083 */
//     }

})



// var fs = require("fs"),
//     uglify = require("uglify-js"),
//     zlib = require("zlib"),
//     surgicate = require("surgicate"),
//     source = surgicate({path:"j2c.js"}).excise("notice").toString(),
//     versions = {
//         "j2c": surgicate({source:source}).excise("inline"),
//         "inline/j2c": surgicate({source:source}).excise("statements") + ""
//     },
//     wrappers = {
//         global: {
//             source: "var j2c = %;",
//             minify: true
//         },
//         commonjs: {
//             source: "module.exports = %;",
//             minify: true // No need to minify before browserification.
//         },
//         es6: {
//             source: "export default %;",
//             minify: false // ATM, uglify chokes on the export statement.
//         },
//         amd: {
//             source: "define('j2c', function(){return %});",
//             minify: true
//         }
//     };

// /*jshint -W079 */
// for (var name in versions) {
// /*jshint +W079 */
//     var src = versions[name];
//     for (var wrp in wrappers) {
//         var wrapped = wrappers[wrp].source.replace("%", src);

//         fs.writeFileSync("dist/" + name + "." + wrp + ".js", wrapped);
//         if (wrappers[wrp].minify) {
// /*jshint -W083 */
//             (function(){
//                 var minified = uglify.minify(
//                     wrapped, {fromString: true}).code,
//                     _name = name,
//                     _wrp = wrp;

//                 fs.writeFileSync("dist/" + name + "." + wrp + ".min.js", minified);
//                 zlib.gzip(minified, function(_, buf){
//                     console.log(_name+"."+_wrp, _ || buf.length);
//                 });
//             })();
// /*jshint +W083 */
//         }
//     }
// }

