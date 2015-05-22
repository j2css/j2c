/*----------------------------------------------------------------------------

/!\ WIP. Works well for simple loading with dependencies, but using the result of 
mithrilLoader() as a dependency is still buggy.

`{loading, element} = mithrilLoader(libs::Arrary [, options::{m::mithril, base::String}])`
where `libs` is an array of strings and array:

    var deps = [
        // a library without dependencies
        "lib1.js",

        // lib2 depends on lib1 and otherdep, which is 
        // another mithrilLoader library.
        ["lib2.js", ["lib1.js", optherdep]], 

        // stylesheets are also supported
        "styles.css"
    ]

The order is irrelevant.

`loading` is a Mithril promise that doubles as a `prop(true)`
that will be resolved to `false` on load to inform the rest of the 
world that dependencies have loaded.

`mithrilLoader` uses m.render() each time a dependency must be added
to the DOM, and one last time when everything has loaded.

So:

    var libs = mithrilLoader(deps, m)

    libs.then(function(){
        this is run just before the last call to m.render()
    })

    var component = {
        view: function(){
            return [
                libs.elements,
                libs.loading()? placeholder : your_app
            ]
        }
    }

See here for an exampl using gratutious intermediate loaders (as a demo)

https://github.com/pygy/j2c/blob/7db41c8fb0d2f12f7ebd7ed7fa9bd9be73a7fae0/index.html#L291-L305


That's it.
----------------------------------------------------------------------------*/

;(function(window){
    var type = {}.toString
      , ARRAY = type.call([])
      , STRING = type.call("")
      ;

    var delayed = (function(){
        var proms = [];
        return {
            postpone: function (promise){
                if (proms.indexOf(promise) === -1) {
                    proms.push(promise);
                }
            },
            run : function(func) {
                proms.forEach(function(p){p.then(func)});
                proms = []
            }
        }
    })();

    function mithrilLoader(libs, options) {
        // Since we iterate over libs backwards, reverse
        // the list to keep the resulting DOM in source
        // order.
        console.log("++Options", options)
        libs = libs.slice(0).reverse()
        options = options || {};
        m = options.m || window.m;
        base = options.base || "";
        base = base[base.length] == '/' ? base : base + '/';

        var tags = []
          , loaded = {}
          , loadedSoFar = 0
          , n = libs.length
          , loading = m.deferred() // loading unless there are no libs.
          , thens = []
          ;
        loading.promise(true);
        if (n == 0){
            loading.resolve(false)
        }

        for (var i = libs.length; i--;) {
            var lib = libs[i];
            if (lib.element && lib.loading) {
                tags.push(lib.element);
                libs.splice(i);
                delayed.postpone(lib.loading)
            }
        }
        console.log("rootlibs delayed.run()")
        delayed.run(onLoad);

        function onLoad(e){
            if (e && e.target && e.target.tagName.toLowerCase() === "script") {
                loaded[e.target.attributes.src.value] = true;
            } else if (e && e.target && e.target.tagName.toLowerCase() === "link"){
                loaded[e.target.attributes.href.value] = true;
            }
            if (++loadedSoFar === n) loading.resolve(false);
            load();
        }
        function createTag(lib) {
            if (lib.match(/\.css$/)) {
                return m("link", {
                    href: lib,
                    itemprop: "stylesheet",
                    rel: "stylesheet",
                    onload: onLoad
                })
            } else if (lib.match(/\.js$/)) {
                return m('script', {
                    src: lib,
                    onload: onLoad
                })
            }
        }
        function _load() {
            for(var i = libs.length; i--;) {
                var lib = libs[i], deps = [];
                if (type.call(lib) == ARRAY){
                    deps = lib[1] || deps;
                    console.log("ARRAY", lib[0])
                    lib = lib[0];
                }
                lib = (type.call(lib) === STRING )? base + lib : lib;
                if (deps.length === 0
                 || deps.every(function (dep) {
                        if(dep.loading) { console.log("dep.loading",dep.loading()) };
                        return dep.loading && !dep.loading() || loaded[base + dep];
                    })
                 ) {
                    tags.push(createTag(lib));
                    console.log(tags, lib, libs)
                    libs.splice(i,1);
                }
            }
        }

        function load(){
            var count = tags.length
            _load()
            if (count !== tags.length || !loading.promise()) m.redraw();
        }

        _load();

        for (var i = libs.length; i--;) {
            var lib = libs[i];
            if (type.call(lib) === ARRAY) {
                var deps = lib[1] || []
                for (var j = deps.length; j--;) {
                    var dep = deps[j];
                    console.log("pushdep", lib[0], "...")
                    if (dep.element && dep.loading) {
                        console.log("...", dep)

                        delayed.postpone(dep.loading);
                    }
                }
            }
        }
        console.log("depslibs delayed.run()")

        delayed.run(load);

        return {
            loading: loading.promise,
            // return a single element to make DOM diffing more efficient.
            element: m("[style=display:none]", tags)
        };
    }
    window.mithrilLoader = mithrilLoader;
    if (typeof module != "undefined" && module !== null && module.exports) module.exports = mithrilLoader;

})(typeof window != 'undefined' ? window : {});