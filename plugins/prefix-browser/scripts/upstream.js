/*eslint-env node*/
/*eslint no-console: 0*/

var rimraf = require('rimraf')
var git    = require('nodegit')

rimraf.sync('upstream/prefixfree')

git
  .Clone('https://github.com/leaverou/prefixfree.git', 'upstream/prefixfree')
  .then(
    function(/*repository*/) {
      process.exit(0)
    }, function(e) {
      console.error(e)
      process.exit(1)
    }
  )