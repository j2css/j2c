/*\

`{loading, element} = mithrilLoader(libs::Arrary [, m::mithril])`
where `libs` is an array of strings and array:

    var deps = [
        "lib1.js", // a library without dependencies
        ["lib2.js", ["lib1.js"]], // lib2 depends on lib1
        "styles.css" // styles are also supported.
    ]

The order is irrelevant.

`loading` is a `prop(true)` that will be set to `false`
to inform the view that dependencies have loaded.
So:

    var libs = mithrilLoader(deps, m)

    var component = {
        view: function(){
            return [
                libs.element,
                libs.loading()? placeholder : your_app
            ]
        }
    }

That's it.
\*/

;(function(window){
    var type = {}.toString
      , ARRAY = type.call([])
      ;
    function mithrilLoader(libs, m) {
        var tags = []
          , loaded = {}
          , n = libs.length
          , loadedSoFar = 0
          ;
        m = m || window.m;
        var loading = loading = m.deferred();
        loading.promise(true);
        if (n == 0){
            loading.resolve(false)
        }
        function onLoad(e){
            if (e.target.tagName.toLowerCase() === "script") {
                loaded[e.target.attributes.src.value] = true;
            } else if (e.target.tagName.toLowerCase() === "link"){
                loaded[e.target.attributes.href.value] = true;
            }
            if (++loadedSoFar === n) loading.resolve(false);
            load();
        }
        function createTag(name) {
            if (name.match(/\.css$/)) {
                return m("link", {
                    href: name,
                    itemprop: "stylesheet",
                    rel: "stylesheet",
                    onload: onLoad
                })
            } else if (name.match(/\.js$/)) {
                return m('script', {
                    src: name,
                    onload: onLoad
                })
            }
        }
        function _load() {
            for(var i = libs.length; i--;) {
                var lib = libs[i], deps = []
                if (type.call(lib) == ARRAY){
                    deps = lib[1] || deps;
                    lib = lib[0]
                }
                if (lib.length === 0 || deps.every(function (dep) {return loaded[dep]})) {
                    tags.push(createTag(lib))
                    libs.splice(i,1)
                }
            }
        }

        function load(){
            var count = tags.length
            _load()
            if (count !== tags.length || !loading.promise()) m.redraw();
        }

        _load();
        // return a single element to make DOM diffing more efficient.
        return {loading:loading.promise, element:m("[style=display:none]", tags)};
    }
    window.mithrilLoader = mithrilLoader;
    if (typeof module != "undefined" && module !== null && module.exports) module.exports = mithrilLoader;

})(typeof window != 'undefined' ? window : {})