// Derived from Lea Verou's PrefixFree and Robin Frischmann's Inline Style Prefixer

import {supportedDecl} from './utils.js'

// db of prop/value pairs whose values may need treatment.

var keywords = [
  // `initial` applies to all properties and is thus handled separately.
  {
    props: ['cursor'],
    values: [ 'grab', 'grabbing', 'zoom-in', 'zoom-out']
  },
  {
    props: ['display'],
    values:['box', 'flexbox', 'inline-flexbox', 'flex', 'inline-flex', 'grid', 'inline-grid']
  },
  {
    props: ['position'],
    values: [ 'sticky' ]
  },
  {
    props: ['column-width', 'height', 'max-height', 'max-width', 'min-height', 'min-width', 'width'],
    values: ['contain-floats', 'fill-available', 'fit-content', 'max-content', 'min-content']
  }
]
// The flexbox zoo
// (and then, this doesn't cover the `flex-direction` => `box-orient` + `box-direction` thing, see main.js)
var ieAltProps = {
  'align-content': '-ms-flex-line-pack',
  'align-self': '-ms-flex-item-align',
  'align-items': '-ms-flex-align',
  'justify-content': '-ms-flex-pack',
  'order': '-ms-flex-order',
  'flex-grow': '-ms-flex-positive',
  'flex-shrink': '-ms-flex-negative',
  'flex-basis': '-ms-preferred-size'
}
var ieAltValues = {
  'space-around': 'distribute',
  'space-between': 'justify',
  'flex-start': 'start',
  'flex-end': 'end',
  'flex': 'flexbox',
  'inline-flex': 'inline-flexbox'
}
var oldAltProps = {
  'align-items': 'box-align',
  'justify-content': 'box-pack',
  'flex-wrap': 'box-lines'
}
var oldAltValues = {
  'space-around': 'justify',
  'space-between': 'justify',
  'flex-start': 'start',
  'flex-end': 'end',
  'wrap-reverse': 'multiple',
  'wrap': 'multiple',
  'flex': 'box',
  'inline-flex': 'inline-box'
}

export function detectKeywords(fixers) {
  if (fixers.prefix === '') return
  // Values that might need prefixing

  for (var kw in keywords) {
    var map = {}, property = kw.props[0]
    for (var i = 0, keyword; keyword = kw[i]; i++) { //eslint disable-line no-cond-assign

      if (
        !supportedDecl(property, keyword) &&
        supportedDecl(property, fixers.prefix + keyword)
      ) {
        fixers.hasKeywords = true
        map[keyword] = fixers.prefix + keyword
      }
    }
    for (property in kw.props) {
      fixers.keywords[property] = map
    }
  }
  if (fixers.keywords.display.flexbox) {
    // old IE
    fixers.keywords.display.flex = fixers.keywords.display.flexbox
    for (var k in ieAltProps) {
      fixers.hasProperties = true
      fixers.properties[k] = ieAltProps[k]
      fixers.keywords[k] = ieAltValues
    }
  } else if (fixers.keywords.display.box) {
    // old flexbox spec
    fixers.keywords.display.flex = fixers.keywords.display.box
    fixers.oldFlexBox = true
    for (k in oldAltProps) {
      fixers.hasProperties = true
      fixers.properties[k] = fixers.prefix + oldAltProps[k]
      fixers.keywords[k] = oldAltValues
    }
  }
  if (
    !supportedDecl('color', 'initial') &&
    supportedDecl('color', fixers.prefix + 'initial')
  ) {
    fixers.initial = fixers.prefix + 'initial'
  }
}
