# j2c

JavaScript to CSS compiler. ~820 bytes mingzipped.

Think SASS, but with JSONish syntax.

----
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Why?](#why)
  - [But, seriously...](#but-seriously)
- [Installation](#installation)
- [Usage](#usage)
  - [For inline decalrations: `j2c(declarations)`](#for-inline-decalrations-j2cdeclarations)
    - [Arrays](#arrays)
      - [Overloading properties](#overloading-properties)
      - [Mixins](#mixins)
    - [Vendor prefixes:](#vendor-prefixes)
  - [For building a style sheet: `j2c.sheet(rules)`](#for-building-a-style-sheet-j2csheetrules)
    - [Telling selectors and properties apart](#telling-selectors-and-properties-apart)
    - [Combining multiple selectors](#combining-multiple-selectors)
    - [At-rules](#at-rules)
    - [CSS Hacks](#css-hacks)
    - [Mixins redux](#mixins-redux)
  - [Scoped sheet for components: `j2c.scoped(...)`](#scoped-sheet-for-components-j2cscoped)
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
* Good fit for virtual DOM frameworks like React or Mithril
* I like writing compilers :-)

### But, seriously...

This is mostly intended as a client-side helper to generate styles for Virtual DOM frameworks (Mithril, React, Mercury...).

Whether or not this is useful as a general CSS replacement remains to be seen.

For that use case, it trades off file size down the line for time lost because the rendering is blocked by executing JS. Benchmarks, especially on underpowered devices are yet to be performed.

## Installation

```Bash
# Please send a PR if you want to see it included in other package systems.
$ npm install j2c
```

then

```JavaScript
var j2c = require('j2c')
```

There are also separate builds for `AMD`, `ES6` and `window.j2c` in the `dist` directory.

## Usage

`j2c` can be used to either assemble inline declarations, full style sheets, or scoped rules, each step building on the former.

Scoped rules are especially useful for client-side frameworks, as can be seen in this simple [Mithril](http://mithril.js.org) module:

```JavaScript
Widget = {
  styles: j2c.scoped({
    title: {
      font_size: '3rem',
      "&:before":{
        color: "#888",
        content: "#"
      }
    },
    content: {
      padding: '2rem',
      margin: '0 0 0.5rem 0'
    }
  }),

  view: function (ctrl) {
    return m('.widget', [
      m('style', Widget.styles)
      m('h3', { class: Widget.styles.title }),
      m('div', { class: Widget.styles.content })
    ])
  }
}
```

Unique class names are generated automatically for `title` and `content`, and assigned to the corresponding properties of the object returned by `j2c.scoped()`.

All methods take in JS objects and return strings. It's up to you to insert the result in the DOM using your favorite method.

### For inline decalrations: `j2c(declarations)`

The `j2c` function walks down JS objects and builds a `property:value;` list out of it.

```JavaScript
j2c({
  background_color:"red",
  border:{
    top$left: {
      width: "1px",
      color: "white"
    }
  }
})
```

Outputs, as you could expect (white space added for readability):

```CSS
background-color: red;
border-top-color: white;
border-top-width: 1px;
border-left-color: white;
border-left-width: 1px;
```

Underscores are automatically turned into dashes so that property names can be left unquoted in the source.

You can combine (sub)properties who share the same value using `$` as a separator. It is useful to specify vendor prefixes. Once again, it allows to leave property names unquoted.

#### Arrays

The order of iteration over the keys of a js object is undefined. If you want to ensure that properties occur in order (say, `border` before `border-left`), use an array:

```JavaScript
j2c([
{border: "solid 1px grey"}
{border_left: "dashed 3px green"}
])
```

```CSS
border: solid 1px grey;
border-left: dashed 3px green;
```

More generally, `j2c([foo,bar])` is equivalent to `j2c(foo) + j2c(bar)`. 

This enables the following techniques:

##### Overloading properties

If you want to overload a property by using an array at the value level

```JavaScript
j2c({
    border_color: ["#33e", "rgba(64,64,255,0.8)"],
})
```

becomes

```CSS
border-color:#33e;
border-color:rgba(64,64,255,0.8);
```

Alternatively:

```JavaScript
j2c([
  { border_color: "#33e"},
  { border_color: "rgba(64,64,255,0.8)"}
])
```

and 

```JavaScript
j2c({
    border:[
      {color: "#33e"},
      {color: "rgba(64,64,255,0.8)"}
    ]
})
```

will give the same result.

##### Mixins

You can mix in properties by using a function call in an array:

```JavaScript
function mixin(color) {
  return {
    border_color: color,
    color: color
  }
}

j2c([
  mixin("red"),
  {
    font_size:"2em"
  }
])
```

```CSS
'color:red;
border-color:red;
font-size:2em;'
```

#### Vendor prefixes:

If the `j2c.vendors` array isn't empty, it is used to automatically add vendor prefixes to all properties.

Most of the resulting combinations don't make any sense (`-moz-color` FTW), and they are simply ignored by browsers. That's the price to pay for the small code size.


```JavaScript
j2c.vendors = ["moz", "webkit"];
j2c({transition:"all 1s"})
```

```CSS
-moz-transition:all 1s;
-webkit-transition:all 1s;
transition:all 1s;
```

Alternatively, you can specify the prefixes by hand using the "$" operator where needed:

```JavaScript
j2c.vendors = []
j2c({
  // Notice the trailing dollar, required for the unprefixed property.
  _o$_ms$_moz$_webkit$: {foo: "bar"},
  hello: "world"
});
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

To prefix values, you can use `j2c.prefix`:

```JavaScript
j2c({
  background_image:j2c.prefix(
    ['moz','webkit'],
    "linear-gradient(90deg, #f00, #ff0)"
  )
})
```

```CSS
background-image: -moz-linear-gradient(90deg, #f00, #ff0);
background-image: -webkit-linear-gradient(90deg, #f00, #ff0);
background-image: linear-gradient(90deg, #f00, #ff0);
```

There's no support for prefixing a list multiple values (e.g. `"linear-gradient(90deg, #f00, #ff0),linear-gradient(90deg, #f00, #ff0)"`).

### For building a style sheet: `j2c.sheet(rules)`

```JavaScript
j2c.sheet({
    "ul.my_root_class": {
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
    }
})

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

`j2c` considers that an object key matching `/^[-_0-9A-Za-z$]+$/` is a property, and everything else is a (sub-)selector. Since underscores are converted to dashes, it means that property names can be left unquoted, while (sub-)selectors have to be quoted.

Selectors are concatenated as is, while properties are concatenated with hyphens. `{" ul": {" li": {padding: {left:10}}}}` becomes ` ul li{padding-left:10px;}`. `{" p":{".foo":{color:"red"}}}`, is translated to ` p.foo:{color:red;}`.

The properties at a given selector level are guaganteed to appear in the CSS output before the ones of sub-selectors and before those present in nested @-rules.

#### Combining multiple selectors

TODO: refactor this section to mention the SASS-like `&` placeholder (at any arbitrary position).

Here's a excerpt from the `j2c` port of the [PocketGrid](https://github.com/arnaudleray/pocketgrid/blob/44aa1154a56b11a852f7252943f265028c28f056/pocketgrid.css).

```JavaScript
j2c.sheet({
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

#### At-rules

`j2c` handles @-rules out of the box, including nested ones.

```JavaScript
j2c.sheet({
  "@media screen": {
    " p": {
      foo:"bar",
      "@media (orientation: landscape)": {
        baz:"qux"
      }
    }
  }
})
```

becomes

```CSS
@media screen {
  p {
    foo: bar;
  }
  @media (orientation: landscape) {
    p {
      baz: qux;
    }
  }
}
```
For `@keyframes` rules, a `@-webkit-keyframes` block is automatically created with auto-prefixed property names.

#### CSS Hacks

Since `sheet.add` only accepts property names that match `/^[-_0-9A-Za-z$]+$/`, it is not possible to express CSS hacks using objects. You can, however, work around the issue by using arrays and strings instead.

Here's another modified excerpt from the PocketGrid port:

```JavaScript
j2c.sheet({
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

#### Mixins redux

Arrays works the same way at the selector level as they do at the property/value one. You can therefore use the [method described in the "inline" section](#mixins).

### Scoped sheet for components: `j2c.scoped(...)`

`j2c.scoped` offers a [`JSS`](https://github.com/jsstyles/jss)-like functionality:

```JavaScript
var sheet = j2c.scoped({
  foo:{color:"red"},
  bar:{margin:0}
});

console.log(sheet.bit);
// 'j2c_371971407_1431849941805_0'
console.log(sheet.bat);
//  'j2c_371971407_1431849941805_1'

// `sheet` is actually a String object, which can be used as a normal string.
console.log(sheet+"");
// '.j2c_371971407_1431849941805_1{margin:0;}.j2c_371971407_1431849941805_0{color:red;}'
```

Unique classes are automatically generated for each scope name. The middle part of the class names ensures that class names are unique even if several instances of `j2c` are used on the page.

Scoped sheets can define nested selectors and use at-rules. The full `j2c.sheet()` functionality is available.

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

`j2c` puts each selector list and properties on their own lines, but doesn't indent or add other white space.

For debugging purposes, I recommend that you pipe `j2c`'s  output through a [[be](https://github.com/mattbasta/crass) [au](https://github.com/beautify-web/js-beautify) [ti](https://github.com/senchalabs/cssbeautify) [fier](http://csstidy.sourceforge.net/)] of your choice.

## License: MIT
