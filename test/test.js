var j2c = require("../dist/j2c.commonjs"),
    CleanCSS = new (require("clean-css"))(),
    expect = require("expect.js");


function check(result, expected){
    result = CleanCSS.minify(result).styles
    expected = (expected instanceof Array ? expected : [expected]).map(function(s){
        return CleanCSS.minify(s).styles;
    });
    expect(expected).to.contain(result);
}

function add(klass, o){
    return j2c.sheet(klass).add(o).toString()
}

var vendors = j2c.vendors;
j2c.vendors = [];



suite("Basic definitions")

test("Simple definition", function() {
    check(
        add("p", {
            foo:"bar"
        }),

        "p{foo:bar}"
    )
})



test("Composed property name", function() {
    check(
        add("p", {
            foo:{bar:"baz"}
        }),

        "p{foo-bar:baz}"
    )
})

test("Composed selector", function() {
    check(

    add("p", {
        " .foo":{bar:"baz"}
    }),

    "p .foo{bar:baz}"
)
})



suite("At rules")

test("Standard At rule with text value", function() {
    check(

    add("p", {
        "@foo":"bar"
    }),

    "@foo bar;"
)
})

test("Standard At rule with object value", function() {
    check(

        add("p", {
            "@foo":{bar:"baz"}
        }),

        "@foo {p{bar:baz}}"
    )
})

test("Several At rules with object value", function() {
    check(

        add("p", {
            "@foo":{bar:"baz"},
            "@foo2":{bar2:"baz2"}
        }),

        [
            "@foo {p{bar:baz}} @foo2 {p{bar2:baz2}}",
            "@foo2 {p{bar2:baz2}} @foo {p{bar:baz}}"
        ]
    )
})

test("Array of At rules with text values", function() {
    check(

        add("p", [
            {"@foo":"bar"},
            {"@foo":"baz"}
        ]),

        "@foo bar; @foo baz;"
    )
})




suite("Units")

test("Default", function() {
    check(
    add("p", {
        foo:5
    }),
    "p{foo:5px}"
)
})

test("Custom", function() {
    j2c.unit = "em"
    check(
        add("p", {
            foo:5
        }),
        "p{foo:5em}"
    )
    j2c.unit = "px"
})

