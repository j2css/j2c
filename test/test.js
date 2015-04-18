var j2c = require("../dist/j2c.commonjs"),
    crass = require("crass"),
    expect = require("expect.js");


function check(result, expected){
    result = crass.parse(result).optimize().toString();
    expected = (expected instanceof Array ? expected : [expected]).map(function(s){
        return crass.parse(s).optimize().toString();
    });
    expect(expected).to.contain(result);
}

function checkinline(result, expected){
    result = "p{" + result + "}"
    expected = (expected instanceof Array ? expected : [expected]).map(function(s){
        return "p{" + s + "}"
    });
    check(result, expected)
}

function add(klass, o){
    return j2c.sheet(klass).add(o).toString()
}

var vendors = j2c.vendors;
j2c.vendors = [];



  ///////////////////////////////
 /**/  suite("Root class")  /**/
///////////////////////////////


test("custom root class", function(){
    var sheet = j2c.sheet("foo")
    expect(sheet.root).to.be("foo")
    check(
        sheet.add({foo:"bar"}).toString(),
        sheet.root + "{foo:bar}"
    )
});

test("default root class", function(){
    var sheet = j2c.sheet()
    expect(sheet.root[0]).to.be(".")
    check(
        sheet.add({foo:"bar"}).toString(),
        sheet.root + "{foo:bar}"
    )
});

test("default root class must be unique", function(){
    var sheet = j2c.sheet()
    expect(j2c.sheet().root).not.to.be(j2c.sheet().root)
});



  //////////////////////////////////////
 /**/  suite("Basic definitions")  /**/
//////////////////////////////////////


test("Simple definition", function() {
    check(
        add("p", {
            foo:"bar"
        }),
        "p{foo:bar}"
    )
});

test("Composed property name", function() {
    check(
        add("p", {
            foo:{bar:"baz"}
        }),

        "p{foo-bar:baz}"
    )
});

test("Composed selector : child with a given class", function() {
    check(
        add("p", {
            " .foo":{bar:"baz"}
        }),

        "p .foo{bar:baz}"
    )
});

test("Composed selector: add a class to the root", function() {
    check(
        add("p", {
            ".foo":{bar:"baz"}
        }),

        "p.foo{bar:baz}"
    )
});

test("Mixing definitions and sub-selectors", function() {
    check(
        add("p", {
            foo:"bar",
            " .foo":{bar:"baz"}
        }),

        "p .foo{bar:baz} p {foo:bar}"
    )
});



  ///////////////////////////////////////
 /**/  suite("Strings and Arrays")  /**/
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


test("Overloaded properties", function() {
    check(
        add("p", {
            foo:["bar","baz"]
        }),
        "p{foo:bar;foo:baz}"
    )
});

test("Overloaded sub-properties", function() {
    check(
        add("p", {
            foo:[{bar:"baz"},{bar:"qux"}]
        }),
        "p{foo-bar:baz;foo-bar:qux}"
    )
});



  /////////////////////////////
 /**/  suite("At rules")  /**/
/////////////////////////////


before(function(){
    // restore a few vendors to ensure that
    // they are not prepended where they shold not.
    j2c.vendors = ["o", "p"];
});

after(function(){
   j2c.vendors = [];
});

test("Standard At rule with text value", function() {
    check(
        add("p", {
            "@import":"'bar'"
        }),

        "@import 'bar';"
    )
});

test("Standard At rule with object value", function() {
    check(
        add("p", {
            "@media foo":{bar:"baz"}
        }),

        "@media foo {p{-o-bar:baz;-p-bar:baz;bar:baz}}"
    )
});

test("Several At rules with object value", function() {
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
    var sheet = j2c.sheet("p")
    check(
        sheet.font({foo:"bar"}).toString(),
        "@font-face{foo:bar}"
    )
});

test("@keyframes", function(){
    var sheet = j2c.sheet("p")
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



  //////////////////////////
 /**/  suite("Units")  /**/
//////////////////////////


test("Default", function() {
    check(
        add("p", {
            foo:5
        }),
        "p{foo:5px}"
    )
});

test("Custom", function() {
    j2c.unit = "em"
    check(
        add("p", {
            foo:5
        }),
        "p{foo:5em}"
    )
    j2c.unit = "px"
});

