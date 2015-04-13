# j2c

A small JavaScript object to CSS compiler. ~680 bytes mingzipped.

Think SASS, but in JSONish syntax.

Inspired by restlye.js and JSS, but smaller :-).

## Why?

* Send small, compact, SASS-like data down the line
* Simplify your asset pipeline
* Use the full power of JavaScript to create mixins, variables and macros
* Stop worrying about vendor prefixes
* Good fit for virtual DOM frameworks like React or Mithril

## Usage:

### For building a style sheet:

```JavaScript
j2c.vendors = [] // for the sake of this demo
                 // defaults to ["o", "ms", "moz", "webkit"].

r = j2c.sheet("ul.my_root_class")

r.add({
    "@media condition": {
        color: "red"
    },
    "font": { // properties for the main ul.my_root_class elements
        size: "2em",
        family: "sans-serif"
    },
    " li": { // sub-selector for children element, notice the initial space.
        padding:{
            left:5, //defaults to px unless otherwise specfied.
            top:10
        } 
    }
})

console.log(r.toString())
```

Output:

```CSS
@media condition{
  ul.my_root_class {
    color:red;
  }
}
ul.my_root_class  li{
  padding-left:5px;
  padding-top:10px;
}
ul.my_root_class {
  font-size:2em;
  font-family:sans-serif;
}
```

#### -vendor-prefixes

If you don't truncate the vendors list as I did in the example above, you'll get each property prefixed for each vendor.

Most of the resulting combinations don't make any sense (`-moz-color` FTW), and they are simply ignored by browsers. That's the price to pay for the small code size.

#### root selector

If no root selector is provided, `J2C` creates one (a unique class).

```JavaScript
r = j2c.sheet()
r.prefix // --> ".j2c_$token_$counter" where `$token` is unique per
         //     j2c instance, and `$counter` is incremented to 
         //     ensure that these classes are unique.
```

#### Telling selectors and properties apart.

`j2c` considers that object keys matching `/^[-_0-9A-Za-z]+$/` as properties, and everything else as (sub-)selectors.

Selectors are concatenated as is, while properties are concatenated with hyphens. `{" ul": {" li": {padding: {left:10}}}}` becomes ` ul li{padding-left:10px;}`. `{" p":{".foo":{color:"red"}}}`, is translated to ` p.foo:{color:red;}`.

#### Overloading properties

```JavaScript
r = j2c.sheet("ul.my_root_class")

r.add({
    "font-size": ["2em", "2rem"]
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
r = j2c.sheet("ul.my_root_class")

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

#### Advanced features:

Here's a `j2c` port of the [PocketGrid](https://github.com/arnaudleray/pocketgrid/blob/44aa1154a56b11a852f7252943f265028c28f056/pocketgrid.css).

```JavaSCript
* Copyright 2013 Arnaud Leray
* MIT License
*/
console.log(j2c.sheet("").add({
  /* Border-box-sizing */
  ".block,.blockgroup":{
    ",:before,:after":{ // Note the initial coma.
                        // It expands to the cartesian product, of
                        // [".block", ".blockgroup"] and
                        // ["", ":before", ":after"], thus:
                        // [.block, .blockgroup,
                        //  .block:before, .blockgroup:before,
                        //  .block:after, .blockgroup:after ]
      "box-sizing":"border-box"
    }
  },
  ".blockgroup": [ // Array elements are inserted in sequence.
    /* Clearfix */
    "*zoom: 1", // A string literal instead of an object is treated
                // as a list of properties. Useful for CSS hacks
                // that would otherwise end up detected as selectors
                // (see the previous section).
    {
      ":before,:after": {
        display: "table",
        content: '""',
        "line-heigth": 0
      },
      ":after": {clear:"both"},

      " > .blockgroup": {
        /* Nested grid */
        clear: "none",
        float: "left",
        margin: "0 !important"
      },

      /* ul/li compatibility */
      "list-style-type":"none",
      padding:0,
      margin:0
    }
  ],
  /* Default block */
  ".block": {
    float: "left",
    width: "100%"
  }
}).toString())
```

Result:

```CSS
.block,.block:before,.block:after,.blockgroup,.blockgroup:before,.blockgroup:after{
  box-sizing:border-box;
}
.blockgroup{
*zoom: 1
}
.blockgroup:before,.blockgroup:after{
  display:table;
  content:"";
  line-heigth:0;
}
.blockgroup:after{
  clear:both;
}
.blockgroup > .blockgroup{
  clear:none;
  float:left;
  margin:0 !important;
}
.blockgroup{
  list-style-type:none;
  padding:0;
  margin:0;
}
.block{
  float:left;
  width:100%;
}
```

### For building inline styles

```JavaScript
console.log(j2c.inline({
    float:"left";
}));
```
... outputs ...
```CSS
-o-float:left;
-ms-float:left;
-moz-float:left;
-webkit-float:left;
float:left;
```

## API Reference

`j2c` object

* `j2c.inline(props:(Object|Array|String)) : String`: returns a declaration list suitable for inline styles
* `j2c.sheet([root:String]) : Sheet`: Creates a Sheet object.
* `j2c.vendors = ["o", "ms", "moz", "webkit"]` (r/w): list of vendor prefixes.
* `j2c.unit = "px"` (r/w): the default unit. `{margin:5}` becomes `margin:5px`.


`Sheet` methods:

* `sheet.add(statements:(Object|Array|String)) : Sheet`: add a series of statements to the style sheet. Returns a `Sheet` for chaining.
* `sheet.toString() : String`: the stylesheet in string form.

## Limitations:

`j2c` knows the bare minimum to output a valid stylesheet when provided with valid input. It will hapily accept invalid selectors, properties and values, and could in that case produce a broken stylesheet.

I may get around and write a validator companion, but I'm not there yet :-).

## License: MIT
