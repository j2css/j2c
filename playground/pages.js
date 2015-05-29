new function(){
  function longString(func) {
    var matches = func.toString().match(/function\s*\(\)\s*\{\s*\/\*\!?\s*([\s\S]+?)\s*\*\/\s*\}/);
    if (!matches) return false;
   
    return matches[1];
  }


  window.pages = [
    {
      name: "Inline styles: intro",
      description: longString(function(){/*!
`j2c.inline()` creates inline styles.

Underscores are converted to dashes so that property names can be left unquoted.

We also show how you combine property names.

<div class="codesample">

```JavaScript
//foo
```
</div>

and 

<div class="CSSsample">

```CSS
.foo{
  color:red;
}
```
</div>
*/}),
      code: longString(function(){/*!
"p {" +

j2c.inline({
  background_color:"red",
  border: {
    top$left: {
      width: "1px",
      color: "white"
    }
  }
})

+ "}"*/})
    }, {
      name: "Inline styles: arrays for order",
      description: longString(function(){/*!
The order of iteration over the keys of a js object is undefined.

If you want to ensure that properties occur in order, use an array:

*/}),
      code: longString(function(){/*!
"p {" +
j2c.inline([
  {border: "solid 1px grey"},
  {border_left: "dashed 3px green"}
])

+ "}"*/})
    }, {
      name: "Style sheet example",
      description: longString(function(){/*!
Here's `j2c.sheet()` example.
*/}),
      code: longString(function(){/*!
j2c.sheet({
  ".foo": {
    color:"red",
    "@media  (max-width:48em)": {
      color:"green"
    },
    "& .bar,& .baz": {
      text_decoration:"underline"
    }
  }
})
*/})
    }, {
      name: "Inline styles: arrays for order",
      description: longString(function(){/*!
This is how `j2c.scoped` works:
*/}),
      code: longString(function(){/*!
sheet = j2c.scoped({
  foo: {
    color:"red",
    "@media  (max-width:48em)": {
      color:"green"
    },
    "& .bar": {
      text_decoration:"underline"
    }
  }
}),
"/* sheet.foo: " + sheet.foo + "*+/\n\n" + sheet
*/}).replace("*+/", "*/")
    }
  ]

  pages.forEach(function (page) {
    var code = page.code;
    page.original = code;
    page.code = m.prop(code)
  });
}

