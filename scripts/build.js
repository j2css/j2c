var fs = require("fs"),
    uglify = require("uglify-js"),
    zlib = require("zlib"),
    source = fs.readFileSync("j2c.js").toString(),

    versions = {
        "j2c": source,
        "inline/j2c": excise(source, "statements")
    },
    wrappers = {
        global: {
            source: ";var j2c = %;",
            minify: true
        },
        commonjs: {
            source: "module.exports = %;",
            minify: false // No need to minify before browserification.
        },
        es6: {
            source: "export default %;",
            minify: false // ATM, uglify chokes on the export statement.
        },
        amd: {
            source: "define('j2c', function(){return %});",
            minify: true
        }
    }

for (name in versions) {
    var src = versions[name];
    for (wrp in wrappers) {
        var wrapped = wrappers[wrp].source.replace("%", src);
            
        fs.writeFileSync("dist/" + name + "." + wrp + ".js", wrapped)
        if (wrappers[wrp].minify) {
            (function(){
                var minified = uglify.minify(wrapped, {fromString: true}).code,
                    _name = name,
                    _wrp = wrp

                fs.writeFileSync("dist/" + name + "." + wrp + ".min.js", minified)
                zlib.gzip(minified, function(_, buf){ 
                    console.log(_name+"."+_wrp, _ || buf.length)
                });
            })();
        }
    }
}

function excise(src, tag) {
    var acc = [],
        removing = false;
    tag = new RegExp("^//"+tag)
    src = src.split("/**/")
    src.forEach(function(section){
        if (!removing) {
            if (section.match(tag)){
                removing = true;
            } else {
                acc.push(section);
            }
        } else {
            if (section.match(tag)){
                removing = false;
                acc.push(section);
            } // else skip the section
        }
    })
    return acc.join("");
}
