var fs = require("fs"),
    source = fs.readFileSync("j2c.js").toString(),

    versions = {
        "j2c": source,
        "j2c.inline": excise(source, "rules")
    },
    wrappers = {
        global: ";var j2c = %;",
        commonjs: "module.exports = %;",
        es6: "export default %;",
        amd: "define('j2c', function(){return %});"
    }

for (name in versions) {
    var src = versions[name];
    for (wrp in wrappers) {
        var wrapped = wrappers[wrp].replace("%", src)//,
            // minified = uglify(wrapped);
        fs.writeFileSync("dist/" + name + "." + wrp + ".js", wrapped)
        // fs.writeFileSync("dist/" + name + "." + wrp + ".min.js", minified)
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
