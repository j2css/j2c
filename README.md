# j2c

A small (~670 bytes mingzipped) JavaScript object to CSS compiler.

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

r = j2c.RuleSet("ul.my_root_class")

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

If you don't truncate the vendors list, you'll get

```CSS
@media condition{
  ul.my_root_class {
    -o-color:red;
    -ms-color:red;
    -moz-color:red;
    -webkit-color:red;
    color:red;
  }
}
ul.my_root_class  li{
  -o-padding-left:5px;
  -ms-padding-left:5px;
  -moz-padding-left:5px;
  -webkit-padding-left:5px;
  padding-left:5px;
  -o-padding-top:10px;
  -ms-padding-top:10px;
  -moz-padding-top:10px;
  -webkit-padding-top:10px;
  padding-top:10px;
}
ul.my_root_class {
  -o-font-size:2em;
  -ms-font-size:2em;
  -moz-font-size:2em;
  -webkit-font-size:2em;
  font-size:2em;
  -o-font-family:sans-serif;
  -ms-font-family:sans-serif;
  -moz-font-family:sans-serif;
  -webkit-font-family:sans-serif;
  font-family:sans-serif;
}
```

Most of the resulting combinations don't make any sense, and they are simply ignored by browsers. That's the price to pay for the small code size.

If no root prefix is provided, `J2C` creates one.

```JavaScript
r = j2c.RuleSet()
r.prefix // --> ".j2c_$token_$counter" where `$token` is unique per j2c instance, and `$counter` is incremented to ensure unique classes.
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

### Overloading properties

```JavaScript
r = j2c.RuleSet("ul.my_root_class")

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
r = j2c.RuleSet("ul.my_root_class")

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

###CSS hacks

Supported, but documentation needed.

## API Reference

* `style:String = j2c.inline(props:(Object|Array|String))`: returns a property-value list suitable for inline styles
* `rs:RuleSet = j2c.RuleSet([prefx:String])`: Creates a RuleSet object.
* `rs:RuleSet = rs.add(rules:(Object|Array|String))`: add a series of rules to the style sheet.
* `rs:String = rs.toString`: the stylesheet in string form.

## Limitations:

`j2c` knows the bare minimum to output a valid stylesheet when provided with valid input. It will hapily accept invalid selectors, properties and values, and could in that case produce a broken stylesheet.

I may get around and write a validator companion, but I'm not there yet :-).

## License: MIT
