# j2c-filter-prefix-browser

This j2c plugin adds client side automatic vendor prefix insertion on the client to j2c.

It prefixes: 

- properties and values (including flexbox and functions),
- selectors,
- at-rules and at-rules parameters (like `@supports (...)` and `@media (min-resolution:2ddpx)`.

See below for a detailed feature set.

Unlike Autoprefixer and the Inline Style Prefixer, it relies on feature detection rather than browser sniffing and it has thus a much larger compatibility. It weights ~3KB minified and gzipped.

You can get a (non-live) sample of its work [here](https://cdn.rawgit.com/j2css/j2c/86db0ee4f2ea0e76eebac0b389c068463e3b1cd4/plugins/prefix-browser/tests/index.html).

Many thanks to [Lea Verou](https://github.com/LeaVerou/) for [PrefixFree](http://leaverou.github.io/prefixfree/) from which most of the feature detection code originates, [Robin Frischmann](https://github.com/rofrischmann) for the [inline-style-prefixer](https://github.com/rofrischmann/inline-style-prefixer/) which helped me undestand the flexbox translation tables, and [Andrey Sitnik](https://github.com/ai) for the [Autoprefixer](https://github.com/postcss/autoprefixer) which is also a resource I've used while building this.

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

## Features

File an issue if you see

### Flexbox

### Selectors

- `:any-link`: `:-x-any-link`,
- `:read-only`: `:-x-read-only`,
- `:read-write`: `:-x-read-write`,
- `::selection`: `::-x-selection`,

- `:fullscreen` => `:-x-fullscreen` or `:-x-fullscreen`
- `::backdrop` => `::-x-backdrop`,

- `::placeholder` => `::-x-placeholder`, `:-x-placeholder`:, `::-x-input-placeholder` or `:-x-input-placeholder`

## What about the server?

It supports a way to bypass the detection code and provide `fixers` objects manually, but these would have to be constructed, either from the caniuse.com data set or by gathering them manually using the detector code and a service like SauceLabs, BrowserStack or Browserling.

That scheme would only work when the server knows the user agent. The plugin doesn't support inserting more than one prefix, or keeping the original as autoprefixer does. Thankfully, for that case (and until a proper DB is consructed), Autoprefixer can be used as a fallback.