var j2c, 
    crass = require("crass"),
    expect = require("expect.js");

["../dist/j2c.commonjs", "../dist/j2c.commonjs.min", "../dist/inline/j2c.commonjs", "../dist/inline/j2c.commonjs.min"].forEach(function(lib){
    j2c = require(lib)
    function check(result, expected){
        result = crass.parse(result).optimize().toString();
        expected = (expected instanceof Array ? expected : [expected]).map(function(s){
            return crass.parse(s).optimize().toString();
        });
        expect(expected).to.contain(result);
    }

    function checkinline(result, expected){
        result = "p{" + j2c.inline(result) + "}"
        expected = (expected instanceof Array ? expected : [expected]).map(function(s){
            return "p{" + s + "}"
        });
        check(result, expected)
    }


    var vendors = j2c.vendors;
    j2c.vendors = [];


      /////////////////////////////
     /**/  suite("Inline, ")  /**/
    /////////////////////////////


    test("a single property", function() {
        checkinline(
            {foo:"bar"},
            "foo:bar;"
        )
    });

    test("array of values", function() {
        checkinline(
            {foo:["bar", "baz"]},
            "foo:bar;foo:baz;"
        )
    });

    test("sub-properties", function(){
        checkinline(
            {foo:{bar:"baz"}},
            "foo-bar:baz;"
        )
    })

    test("multiple sub-properties", function(){
        checkinline(
            {foo:{"bar/qux":"baz"}},
            "foo-bar:baz;foo-qux:baz;"
        )
    })

    test("multiple sub-properties with a sub-sub-property", function(){
        checkinline(
            {foo:{"bar/baz":{qux:"quux"}}},
            "foo-bar-qux:quux;foo-baz-qux:quux;"
        )
    })

    test("multiple sub-properties with two sub-sub-properties", function(){
        checkinline(
            {foo:{"bar/baz":{"qux/quux":"fred"}}},
            "foo-bar-qux:fred;foo-bar-quux:fred;foo-baz-qux:fred;foo-baz-quux:fred;"
        )
    })

    test("convert underscores", function() {
        checkinline(
            {"f_o_o":"bar"},
            "f-o-o:bar;"
        )
    });

    test("String value", function() {
        checkinline(
            "foo:bar",
            "foo:bar;"
        )
    });

    test("Array of Strings values", function() {
        checkinline(
            ["foo:bar","foo:baz"],
            "foo:bar;foo:baz"
        )
    });

    test("Array of mixed values", function() {
        checkinline(
            ["foo:bar",{foo:"baz"}],
            "foo:bar;foo:baz"
        )
    });

    test("CSS Hack", function() {
        checkinline(
            {"*foo":"bar"},
            "*foo:bar;"
        )
    });
    
      //////////////////////////////////////
     /**/  suite("Inline prefixes, ")  /**/
    //////////////////////////////////////

    before(function() {j2c.vendors = ["o", "p"]})
    after(function() {j2c.vendors = []})

    test("vendor prefixes", function() {
        checkinline(
            ["foo:bar",{foo:"baz"}],
            "-o-foo:bar;-p-foo:bar;foo:bar;-o-foo:baz;-p-foo:baz;foo:baz"
        )
    });

});




["../dist/j2c.commonjs", "../dist/j2c.commonjs.min"].forEach(function(lib){
    j2c = require(lib)
    function check(result, expected){
        result = crass.parse(result).optimize().toString();
        expected = (expected instanceof Array ? expected : [expected]).map(function(s){
            return crass.parse(s).optimize().toString();
        });
        expect(expected).to.contain(result);
    }

    function checkinline(result, expected){
        result = "p{" + j2c.inline(result) + "}"
        expected = (expected instanceof Array ? expected : [expected]).map(function(s){
            return "p{" + s + "}"
        });
        check(result, expected)
    }

    function add(klass, o){
        return j2c(klass).add(o).toString()
    }

    var vendors = j2c.vendors;
    j2c.vendors = [];



      ///////////////////////////////
     /**/  suite("Root class")  /**/
    ///////////////////////////////


    test("custom root class", function(){
        var sheet = j2c("foo")
        expect(sheet.root).to.be("foo")
        check(
            sheet.add({foo:"bar"}).toString(),
            sheet.root + "{foo:bar}"
        )
    });

    test("default root class", function(){
        var sheet = j2c()
        expect(sheet.root[0]).to.be(".")
        check(
            sheet.add({foo:"bar"}).toString(),
            sheet.root + "{foo:bar}"
        )
    });

    test("default root class must be unique", function(){
        var sheet = j2c()
        expect(j2c().root).not.to.be(j2c().root)
    });


      //////////////////////////////////
     /**/  suite("Definitions, ")  /**/
    //////////////////////////////////


    test("basic", function() {
        check(
            add("p", {
                foo:"bar"
            }),
            "p{foo:bar}"
        )
    });

    test("convert underscores", function() {
        check(
            add("p", {
                foo_foo:"bar"
            }),
            "p{foo-foo:bar}"
        )
    });

    test("number values", function() {
        check(
            add("p", {
                foo:5
            }),
            "p{foo:5}"
        )
    });

    test("composed property name", function() {
        check(
            add("p", {
                foo:{bar:"baz"}
            }),

            "p{foo-bar:baz}"
        )
    });

    test("composed selector : child with a given class", function() {
        check(
            add("p", {
                " .foo":{bar:"baz"}
            }),

            "p .foo{bar:baz}"
        )
    });

    test("composed selector: add a class to the root", function() {
        check(
            add("p", {
                ".foo":{bar:"baz"}
            }),

            "p.foo{bar:baz}"
        )
    });

    test("mixing definitions and sub-selectors", function() {
        check(
            add("p", {
                foo:"bar",
                " .foo":{bar:"baz"}
            }),

            "p .foo{bar:baz} p {foo:bar}"
        )
    });



      ///////////////////////////////////////////////
     /**/  suite("Selector Cartesian product, ")  /**/
    ///////////////////////////////////////////////


    test("1 x 2", function() {
        check(
            add("p", {
                " .foo":{
                    ":before,:after":{
                        foo:"bar"
                    }
                }
            }),

            "p .foo:before, p .foo:after {foo:bar}"
        )
    });

    test("2 x 1", function() {
        check(
            add("p", {
                " .foo, .bar":{
                    ":before":{
                        foo:"bar"
                    }
                }
            }),

            "p .foo:before, p .bar:before {foo:bar}"
        )
    });

    test("2 x 2", function() {
        check(
            add("p", {
                " .foo, .bar":{
                    ":before,:after":{
                        foo:"bar"
                    }
                }
            }),

            "p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}"
        )
    });


    test("2 x 3 one of which is empty", function() {
        check(
            add("p", {
                " .foo, .bar":{
                    ",:before,:after":{
                        foo:"bar"
                    }
                }
            }),

            "p .foo, p .bar, p .foo:before, p .bar:before, p .foo:after, p .bar:after {foo:bar}"
        )
    });



      ///////////////////////////////////////
     /**/  suite("Strings and Arrays, ")  /**/
    ///////////////////////////////////////


    test("String literal", function() {
        check(
            add("p", "foo:bar"),
            "p{foo:bar}"
        )
    });

    test("Array of String literals", function() {
        check(
            add("p", ["foo:bar", "foo:baz"]),
            "p{foo:bar;foo:baz}"
        )
    });


    test("overloaded properties", function() {
        check(
            add("p", {
                foo:["bar","baz"]
            }),
            "p{foo:bar;foo:baz}"
        )
    });

    test("overloaded sub-properties", function() {
        check(
            add("p", {
                foo:[{bar:"baz"},{bar:"qux"}]
            }),
            "p{foo-bar:baz;foo-bar:qux}"
        )
    });

    test("nested Arrays", function(){
        check(
            add("p", [
                [
                    {bar:"baz"},
                    {bar:"qux"}
                ],
                "bar:quux;"
            ]),
            "p {bar:baz;bar:qux;bar:quux}"
        )
    })



      ///////////////////////////////
     /**/  suite("At rules, ")  /**/
    ///////////////////////////////


    before(function(){
        // restore a few vendors to ensure that
        // they are not prepended where they shold not.
        j2c.vendors = ["o", "p"];
    });

    after(function(){
       j2c.vendors = [];
    });

    test("standard At rule with text value", function() {
        check(
            add("p", {
                "@import":"'bar'"
            }),

            "@import 'bar';"
        )
    });

    test("standard At rule with object value", function() {
        check(
            add("p", {
                "@media foo":{bar:"baz"}
            }),

            "@media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}}"
        )
    });

    test("several At rules with object value", function() {
        check(
            add("p", {
                "@media foo":{bar:"baz"},
                "@media foo2":{bar2:"baz2"}
            }),
            [
                "@media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}} @media foo2 {p{-o-bar2:baz2;-p-bar2:baz2;bar2:baz2}}",
                "@media foo2 {p{-o-bar2:baz2;-p-bar2:baz2;bar2:baz2}} @media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}}"
            ]
        )
    });

    test("Array of At rules with text values", function() {
        check(
            add("p", [
                {"@import":"'bar'"},
                {"@import":"'baz'"}
            ]),
            "@import 'bar'; @import 'baz';"
        )
    });

    test("@font-face", function(){
        var sheet = j2c("p")
        check(
            sheet.font({foo:"bar"}).toString(),
            "@font-face{foo:bar}"
        )
    });

    test("@keyframes", function(){
        var sheet = j2c("p")
        check(
            sheet.keyframes("qux", {
                " from":{foo:"bar"},
                " to":{foo:"baz"}
            }).toString(),
            [
                "@-o-keyframes qux{from{-o-foo:bar;foo:bar}to{-o-foo:baz;foo:baz}}" +
                "@-p-keyframes qux{from{-p-foo:bar;foo:bar}to{-p-foo:baz;foo:baz}}" +
                "@keyframes qux{from{-o-foo:bar;-p-foo:bar;foo:bar}to{-o-foo:baz;-p-foo:baz;foo:baz}}",

                "@-o-keyframes qux{to{-o-foo:baz;foo:baz}from{-o-foo:bar;foo:bar}}" +
                "@-p-keyframes qux{to{-p-foo:baz;foo:baz}from{-p-foo:bar;foo:bar}}" +
                "@keyframes qux{to{-o-foo:baz;-p-foo:baz;foo:baz}from{-o-foo:bar;-p-foo:bar;foo:bar}}",
            ]
        )
    });

})




