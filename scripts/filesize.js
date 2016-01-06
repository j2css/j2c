/*eslint-env node*/
/*eslint no-console: 0*/
var zlib = require('zlib'), fs = require('fs')

console.log('mingzipped sizes in bytes:');

['commonjs', 'global', 'amd'].forEach(function(kind){
  var source = fs.readFileSync('dist/j2c.' + kind + '.min.js')
  var size = zlib.gzipSync(source, {level: 9}).length
  // custom console
  console.log(kind, size)
})