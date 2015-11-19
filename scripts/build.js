#! /usr/bin/env node
var fs = require("fs"),
    uglify = require("uglify-js"),
    zlib = require("zlib"),
    surgicate = require("surgicate"),
    source = surgicate({path:"j2c.js"}).excise("notice").toString(),
    versions = {
        "j2c": surgicate({source:source}).excise("inline"),
        "inline/j2c": surgicate({source:source}).excise("statements") + ""
    },
    wrappers = {
        global: {
            source: "var j2c = %;",
            minify: true
        },
        commonjs: {
            source: "module.exports = %;",
            minify: true // No need to minify before browserification.
        },
        es6: {
            source: "export default %;",
            minify: false // ATM, uglify chokes on the export statement.
        },
        amd: {
            source: "define('j2c', function(){return %});",
            minify: true
        }
    };

/*jshint -W079 */
for (var name in versions) {
/*jshint +W079 */
    var src = versions[name];
    for (var wrp in wrappers) {
        var wrapped = wrappers[wrp].source.replace("%", src);
            
        fs.writeFileSync("dist/" + name + "." + wrp + ".js", wrapped);
        if (wrappers[wrp].minify) {
/*jshint -W083 */
            (function(){
                var minified = uglify.minify(
                    wrapped, {fromString: true}).code,
                    _name = name,
                    _wrp = wrp;

                fs.writeFileSync("dist/" + name + "." + wrp + ".min.js", minified);
                zlib.gzip(minified, function(_, buf){ 
                    console.log(_name+"."+_wrp, _ || buf.length);
                });
            })();
/*jshint +W083 */
        }
    }
}

