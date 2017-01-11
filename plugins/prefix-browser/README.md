# j2c-filter-prefix-browser

This j2c plugin adds client side automatic vendor prefix insertion on the client to j2c.

It handles: 

- properties and values, including flexbox and nested functions,
- selectors,
- at-rules and at-rules parameters like `@supports (...)` and `@media (min-resolution:2ddpx)`.

See below for a detailed feature set.

Unlike Autoprefixer and the Inline Style Prefixer, it relies on feature detection rather than browser sniffing and it supports more browsers. It weights ~3KB minified and gzipped.

You can get a (non-live) sample of its work [here](https://cdn.rawgit.com/j2css/j2c/86db0ee4f2ea0e76eebac0b389c068463e3b1cd4/plugins/prefix-browser/tests/index.html).

The plugin is well tested (385 assertions, many of which are `deepEquals` on nested objects) and has 100% branch coverage (which doesn't mean it is bug free, off course).

Many thanks to [Lea Verou](https://github.com/LeaVerou/) for [PrefixFree](http://leaverou.github.io/prefixfree/) from which most of the feature detection code originates, [Robin Frischmann](https://github.com/rofrischmann) for the [inline-style-prefixer](https://github.com/rofrischmann/inline-style-prefixer/) which helped me undestand the flexbox translation tables, and [Andrey Sitnik](https://github.com/ai) for the [Autoprefixer](https://github.com/postcss/autoprefixer) which is also a resource I've used while building this.

----

- [Usage](#usage)
- [Features](#features)
  - [Properties](#properties)
  - [Values](#values)
    - [Keywords](#keywords)
    - [Functions](#functions)
    - [Values that are property names](#values-that-are-property-names)
  - [Flexbox](#flexbox)
    - [Flexbox 2009 (`-moz-box` and `-webkit-box`)](#flexbox-2009--moz-box-and--webkit-box)
    - [Flexbox 2012 (`-ms-flexbox`)](#flexbox-2012--ms-flexbox)
    - [Final spec, prefixed (`-webkit-flex`)](#final-spec-prefixed--webkit-flex)
  - [Selectors](#selectors)
  - [At rules](#at-rules)
- [What about the server side?](#what-about-the-server-side)
- [And what about speed?](#and-what-about-speed)
- [License: MIT](license-mit)

----

## Usage

```BASH
$ npm install --save j2c-plugin-prefix-browser
#or
$ yarn add j2c-plugin-prefix-browser
```

```JS
var J2c = require("j2c")
var j2c = new J2c(require("j2c-plugin-prefix-browser"))

j2c.sheet({
  "@keyframes foo": {
    from: {size: "100px"},
    to: {size: "200px"}
  }
})
```

```CSS
/* Assuming that it ran in an old Safari version: */

@-webkit-keyframes foo_j2c-xxx {
  from {
    size: 100px;
  }
  to {
    size: 200px;
  }
} 
```

## Features

Please file an issue if you see something missing.

### Properties

Properties that are supported with a prefix and unsupported unprefixed will be prefixed.

### Values

The following values can get a prefix:

#### Keywords

##### All properties:

`initial`

##### `cursor`
    
`grab`, `grabbing`, `zoom-in`, `zoom-out`

##### `display`

The flexbox zoo (see below), plus `grid` and `inline-grid`

##### `position`

`sticky`

##### `width`, `column-width`, `height`, `max-height`, `max-width`, `min-height`, `min-width`

`contain-floats`, `fill-available`, `fit-content`, `max-content` and `min-content`

#### Functions

Gradients, `calc()`, `element()` and `cross-fade()` are prefixed, even if they are nested in other functions.

Prefixed gradients also have their angle changed from trigonometric to clockwise coordinates.

#### Values that are property names

`transiton:`, `transition-property:` and `will-change:` take properties as arguments. They are prefixed where needed.

### Flexbox

The plugin translates the final flexbox spec to its older versions as much as possible. 

#### Flexbox 2009 (`-moz-box` and `-webkit-box`)

##### Properties

- (`align-content` => ? no mapping AFAIK please chime in if you know any)
- (`align-self` => ?)
- `align-items` => `-x-box-align`,
- `flex` => `-x-box-flex`
- (`flex-basis` => ?)
- `flex-direction` => `-x-box-direction` + `-x-box-orient`
- `flex-flow` => `-x-box-direction` + `-x-box-orient` and/or `-x-box-lines`
- (`flex-grow` => ?)
- (`flex-shrink` => ?)
- `flex-wrap` => `-x-box-lines`,
- `justify-content`: `-x-box-pack`,
- `order`: `-x-box-ordinal-group`

##### Values

- `flex` => `-x-box`
- `inline-flex` => `-x-inline-box`

- `column` ~> `block-axis` (for `-x-box-orient`) + `normal` (for `box-direction)
- `column-reverse ~> `block-axis` + `reverse`
- `row` ~> `inline-axis` + `normal`
- `row-reverse` ~> `inline-axis` + `reverse`

- `flex-end`: `end`,
- `flex-start` => `start`,
- `nowrap`: `single`,
- `space-around` ~> `justify`,
- `space-between` => `justify`,
- `wrap` => `multiple`,
- `wrap-reverse` ~> `multiple`

#### Flexbox 2012 (`-ms-flexbox`)

##### Properties

- `align-content` => `-ms-flex-line-pack`,
- `align-items` => `-ms-flex-align`,
- `align-self` => `-ms-flex-item-align`,
- (`flex` => `-ms-flex`)
- `flex-basis` => `-ms-preferred-size`,
- `flex-direction` => `-ms-flex-direction`
- `flex-flow` => `-ms-flex-flow`
- `flex-grow` => `-ms-flex-positive`,
- `flex-shrink` => `-ms-flex-negative`,
- (`flex-wrap` => `-ms-flex-wrap`)
- `justify-content` => `-ms-flex-pack`,
- `order` => `-ms-flex-order`

##### Values

- `flex` => `-ms-flexbox`
- `inline-flex` => `-ms-inline-flexbox`

- (`column` => `column`)
- (`column-reverse` => `column-reverse)
- (`row` => `row`)
- (`row-reverse` => `row-reverse`)

- `flex-end` => `end`,
- `flex-start` => `start`,
- `space-around` => `distribute`,
- `space-between` => `justify`
- (`wrap` => `wrap`)
- (`wrap-reverse` => `wrap-reverse`)

#### Final spec, prefixed (`-webkit-flex`)

No special treatment is necessary, prefixes are applied normally where needed.

### Selectors

- `:any-link`: `:-x-any-link`,
- `:read-only`: `:-x-read-only`,
- `:read-write`: `:-x-read-write`,
- `::selection`: `::-x-selection`,
- `:fullscreen` => `:-x-fullscreen` or `:-x-fullscreen`
- `::backdrop` => `::-x-backdrop`,
- `::placeholder` => `::-x-placeholder`, `:-x-placeholder`:, `::-x-input-placeholder` or `:-x-input-placeholder`

The `:-webkit-scrollbar` pseudo-element/pseudo-class family not implemented since it is webkit-only and not on a standard track AFAIK.

### At rules

`@keyframes`, `@document` and `@viewport` get a prefix where needed.

`@media (min/max-resolution: 2dppx)` is converted to `-webkit-min/max-device-pixel-ratio:2`, `min/max--moz-device- pixel-ratio:2` and `min/max-resolution: 192dpi` when necessary (even to `-o-device-pixel-ratio 20/10`).

The parameters of `@supports` have also their properties and values prefixed automatically.

## What about the server side?

The plugin supports a way to bypass the detection code and provide `fixers` objects manually, but these would have to be constructed, either from the caniuse.com data set and cross-checking it by using our detector code with a service like SauceLabs, BrowserStack or Browserling.

That scheme would only work when the server knows the user agent. The plugin doesn't support inserting more than one prefix, or keeping the originals as Autoprefixer and inline-style-prefixer do. Thankfully, for that case (and until a proper DB is constructed), Autoprefixer can be used as a fallback.

## And what about speed?

The plugin is designed to be as fast as possible. Most of the feature detection is performed upfront to enable the fastest operation possible while applying prefixes. Allocations and branches are kept to a bare minimum after initialization (the prefixes are applied once and then cached). No objects beside strings are created while prefixing (with one exception when `flex-flow` has to be translated to the 2009 equivalent, the value is `.split(' ')` into an array.).

## License: MIT