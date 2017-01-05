var fs = require('fs')
var path = require('path')

module.exports.upToDate = function(baseDir, name) {
  var sourceTime = fs.statSync(path.join(baseDir, name)).mtime.getTime()
  var exposedTime = fs.statSync(path.join(__dirname, 'exposed.js')).mtime.getTime()
  return sourceTime < exposedTime
}