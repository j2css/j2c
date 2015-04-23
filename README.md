# j2c

JavaScript to CSS compiler. ~720 bytes mingzipped.

Think SASS, but in JSONish syntax.

----
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Why?](#why)
  - [But, seriously...](#but-seriously)
- [Installation](#installation)
- [Usage](#usage)
  - [For building a style sheet](#for-building-a-style-sheet)
    - [Telling selectors and properties apart](#telling-selectors-and-properties-apart)
    - [Overloading properties](#overloading-properties)
    - [Combining properties](#combining-properties)
    - [Combining multiple selectors](#combining-multiple-selectors)
    - [-vendor-prefixes](#-vendor-prefixes)
    - [root selector](#root-selector)
    - [At-rules](#at-rules)
    - [CSS Hacks](#css-hacks)
  - [For building inline styles](#for-building-inline-styles)
- [API Reference](#api-reference)
  - [`j2c` and static fields](#j2c-and-static-fields)
  - [`Sheet` methods](#sheet-methods)
- [Limitations](#limitations)
  - [Selectors and properties order](#selectors-and-properties-order)
  - [No input validation](#no-input-validation)
  - [No pretty printing](#no-pretty-printing)
- [License: MIT](#license-mit)

<small>*TOC generated with [DocToc](https://github.com/thlorenz/doctoc), then tweaked a bit.*</small>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

----

## Why?

* Send small, compact, SASS-like data down the line
* Simplify your asset pipeline
* Use the full power of JavaScript for mixins, variables, macros and feature detection
* Stop worrying about vendor prefixes
* Good fit for virtual DOM frameworks like React or Mithril
* I like writing compilers :-)

### But, seriously...

This is mostly intended as a client-side helper to generate styles for Virtual DOM components (React, Mithril, Mercury...).

Whether or not this is useful as a general CSS replacement remains to be seen.

For that use case, it trades off file size down the line for time lost because the rendering is blocked by executing JS. Benchmarks, especially on underpowered devices are yet to be performed.

## Installation

```Bash
$ npm install j2c
```

Please send a PR if you want to see it inclueded in other package systems.

## Usage

### For building a style sheet

```JavaScript
j2c.vendors = [] // for the sake of this demo
                 // defaults to ["o", "ms", "moz", "webkit"].

r = j2c("ul.my_root_class")

r.add({
    "@media condition": {
        color: "red"
    },
    // properties for the main ul.my_root_class elements
    font: { 
        size: "2em",
        family: "sans-serif"
    },
    // underscores in property names are converted to dashes.
    background_color: "#44f", 

    // sub-selector for children element, notice the mandatory initial space
    // signifying a child element.
    " li": { 
        padding:{
            left: "5px"
            top: "10px"
        },
        // convenient $hortcut.
        border: {left$right: {width: "2px"}}
    }
})

console.log(r.toString())
```

Output (beautified):

```CSS
@media condition {
  ul.my_root_class {
    color:red;
  }
}
ul.my_root_class  li {
  padding-left:5px;
  padding-top:10px;
  border-left-width:2px;
  border-right-width:2px;
}
ul.my_root_class {
  font-size:2em;
  font-family:sans-serif;
  background-color:#44f;
}
```

#### Telling selectors and properties apart

`j2c` considers that an object key matching `/^[-_0-9A-Za-z$]+$/` is property, and everything else is a (sub-)selector. Since underscores are converted to dashes, it means that property names can be left unquoted, while (sub-)selectors have to be quoted.

Selectors are concatenated as is, while properties are concatenated with hyphens. `{" ul": {" li": {padding: {left:10}}}}` becomes ` ul li{padding-left:10px;}`. `{" p":{".foo":{color:"red"}}}`, is translated to ` p.foo:{color:red;}`.

#### Overloading properties

```JavaScript
r = j2c("ul.my_root_class")

r.add({
    font_size: ["2em", "2rem"]
})

console.log(r.toString())
```
becomes
```CSS
.foo {
  font-size:2em;
  font-size:2rem;
}
```

Alternatively

```JavaScript
r = j2c("ul.my_root_class")

r.add([
    {
        "font-size": "2em"
    },
    {
        "font-size": "2rem"
    }
])

console.log(r.toString())
```
becomes
```CSS
ul.my_root_class {
  font-size:2em;
}
ul.my_root_class {
  font-size:2rem;
}
```

#### Combining properties

```JavaScript
j2c("p").add({
  border: {
    left_color: "#fab",
    right_color: "#fab"
  }
}
})
```

can be shortened as

```JavaScript
j2c("p").add({
  border: {left$right: {color: "#fab"}}
}
})
```

#### Combining multiple selectors

Here's a excerpt from the `j2c` port of the [PocketGrid](https://github.com/arnaudleray/pocketgrid/blob/44aa1154a56b11a852f7252943f265028c28f056/pocketgrid.css).

```JavaScript
j2c("").add({
  ".block,.blockgroup":{
    ",:before,:after":{          // Notice the initial coma.
      box_sizing:"border-box"
    }
  }
}
```

Nesting `",:before,:after"` inside the `".block,.blockgroup"` block combines `[".block", ".blockgroup"]` with `["", ":before", ":after"]`, giving 

```CSS
.block,.block:before,.block:after,.blockgroup,.blockgroup:before,.blockgroup:after{
    box-sizing:border-box;
}
```

Mathy folks call this as a Cartesian product.

#### -vendor-prefixes

If you don't truncate the vendors list as I did in the example above, you'll get each property prefixed for each vendor.

Most of the resulting combinations don't make any sense (`-moz-color` FTW), and they are simply ignored by browsers. That's the price to pay for the small code size.

Alternatively, you can specify the prefixes by hand using the "$" operator where needed:

```JavaScript
j2c.vendors = []
j2c("p").add({
  // Notice the trailing dollar, required for the unprefixed property.
  _o$_ms$_moz$_webkit$: {foo: "bar"},
  hello: "world"
}).toString()
```

Compiles to

```CSS
p {
  -o-foo:bar;
  -ms-foo:bar;
  -moz-foo:bar;
  -webkit-foo:bar;
  foo:bar;
  hello:world;
}
```

#### root selector

If no root selector is provided, `J2C` creates one (a unique class).

```JavaScript
r = j2c()
r.prefix // --> ".j2c_$token_$counter" where `$token` is unique per
         //     j2c instance, and `$counter` is incremented to 
         //     ensure that these classes are unique.
```

#### At-rules

Most At-rules are handled out of the box by `sheet.add()`. However, `@font-face` and `@keyframes` have are not covered and they are implemented respectively by `sheet.font(definitions)` and `sheet.keyframes(name, definitions)`. The latter automatically generates browser-specific `@-vendor-keyframes` blocks.

#### CSS Hacks

Since `sheet.add` only accepts property names that match `/^[-_0-9A-Za-z$]+$/`, it is not possible to express CSS hacks using objects. You can, however, work around the issue by using arrays and strings instead.

Here's another modified excerpt from the PocketGrid port:

```JavaScript
j2c("").add({
  ".blockgroup": [
    "*zoom: 1; /* hackety hackery */",
    {
      "list-style-type":"none",
      padding:0,
      margin:0
    }
  ]
})
```

Array elements are inserted in sequence, and string literals are treated as a list of properties, and inserted as is.

Result:

```CSS
.blockgroup{
*zoom: 1; /* hack */
}
.blockgroup{
  list-style-type:none;
  padding:0;
  margin:0;
}
```

You can also pass th result of `j2c.inline` which is less picky about property names.

### For building inline styles

Here's an example that demonstrates most of the `j2c.inline` capabilities:

```JavaScript
j2c.vendors = []
j2c.inline({
  background_image: "url(bg.png)",
  border: {
    color: ["#33e", "rgba(64,64,255,0.8)"],
    top$left: {width: "1px"},
  }
  color: ,
  font: {
    size: "2em",
    weight: 700
  },
  "*zoom": 1
})
```

Result (paired items are guaranteed to appear in order):

```CSS
background-image: url(bg.png);

border-color: #33e;
border-color: rgba(64,64,255,0.8);

border-top-width: 1px;
border-left-width: 1px;

font-size: 2em;

font-weight: 700;

*zoom: 1;
```

If order is iportant, use `Arrays`:

```JavaScript
j2c.inline([
  "margin:0",
  {
    margin_left:{
      width: "2px",
      color: "red"
    }
  }
])
```

Becomes

```CSS
margin: 0;

// the above is guaranteed to occur before the next two

margin-left-color:red;
margin-left-width:2px;
```

Also, provided the vendors list isn't empty, each property ends up prefixed by each vendor, then unprefixed.

```JavaScript
console.log(j2c.inline({
    foo:"bar";
}));
```
... outputs ...
```CSS
-o-foo:bar;
-ms-foo:bar;
-moz-foo:bar;
-webkit-foo:bar;
foo:bar;
```

## API Reference

### `j2c` and static fields

* `j2c([root:String]) : Sheet`: Creates a Sheet object.
* `j2c.inline(props:(Object|Array|String)) : String`: returns a declaration list suitable for inline styles
* `j2c.vendors = ["o", "ms", "moz", "webkit"]` (r/w): list of vendor prefixes.


### `Sheet` methods

* `sheet.add(statements:(Object|Array|String)) : Sheet`: add a series of statements to the style sheet. Returns the `Sheet` for chaining.
* `sheet.font(definitions:(Object|Array|String)) : Sheet`: creates a `@font-face` block. Returns the `Sheet` for chaining.
* `sheet.keyframes(name:String, statements:(Object|Array|String)) : Sheet`: creates a `@keyframes` block. Returns the `Sheet` for chaining.
* `sheet.toString() : String`: the stylesheet in string form.

## Limitations

### Selectors and properties order

`j2c` relies on JS objects to define selectors and properties. As a consequence, the source order cannot be guaranteed to be respected in the output. 

```Javascript
j2c(".hello").add({
  foo:"bar",
  baz:"qux"
}).toString()
```

This may produce either `.hello{foo:bar;baz:qux;}` or `.hello{baz:qux;foo:bar;}`.

If you need some selectors or properties to happen in order, use an array of objects.

```Javascript
j2c(".hello").add([
  {foo:"bar"},
  {baz:"qux"}
]).toString()
```

This will always yield `.hello{foo:bar;}.hello{baz:qux;}`.

### No input validation

`j2c` knows the bare minimum to output a valid stylesheet when provided with valid input. It will hapily accept invalid selectors, properties and values, and could in that case produce a broken stylesheet.

I may get around and write a validator companion, but I'm not there yet :-).

### No pretty printing

For debugging purposes, I recommend that you pipe `j2c`'s  output through a [[be](https://github.com/mattbasta/crass) [au](https://github.com/beautify-web/js-beautify) [ti](https://github.com/senchalabs/cssbeautify) [fier](http://csstidy.sourceforge.net/)] of your choice.

## License: MIT
