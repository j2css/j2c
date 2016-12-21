# j2c-filter-prefix-browser

This j2c plugin adds client side automatic vendor prefix insertion on the client to j2c.

It is based on Lea Verou's PrefixFree and it can thus prefix properties, values, at-rules and selectors as needed.

## Usage:

```JS
var j2c = require("j2c")
var prefixPlugin = require("j2c-plugin-prefix-browser")
var styler = j2c().use(prefixPlugin)

// Suppose that this will run in an old Safari version:

styler.sheet({"@keyframes foo": {
  from:{size: "100px"}, to:{size: "200px"}
}})

/* output:
@-webkit-keyframes foo_j2c-xxx {
  from {
    size: 100px;
  }
  to {
    size: 200px;
  }
} 
*/
```