# j2c-filter-prefix-browser

This j2c plugin adds client side automatic vendor prefix insertion on the client to j2c.

It is based on Lea Verou's PrefixFree and it can thus prefix properties, values, at-rules and selectors as needed.

Unlike Autoprefixer and the Inline Style Prefixer, it relies on feature detection rather than browser sniffing and it has thus a much larger compatibility. It weights ~3KB minified and gzipped.

You can get a (non-live) sample of its work [here](https://cdn.rawgit.com/j2css/j2c/86db0ee4f2ea0e76eebac0b389c068463e3b1cd4/plugins/prefix-browser/tests/index.html).

## Usage:

```JS
var J2c = require("j2c")
var j2c = J2c(require("j2c-plugin-prefix-browser"))

// Suppose that this will run in an old Safari version:

j2c.sheet({"@keyframes foo": {
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
