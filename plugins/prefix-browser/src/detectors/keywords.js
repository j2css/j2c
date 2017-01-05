// Derived from Lea Verou's PrefixFree and Robin Frischmann's Inline Style Prefixer

// TODO: http://caniuse.com/#feat=css-writing-mode

import {deCamelCase, supportedDecl} from './utils.js'

// db of prop/value pairs whose values may need treatment.

var keywords = [
  //!\\ use camelCase property names only, the test mocks don't support
  //!\\ them kebab-cased

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
    props: ['width', 'columnWidth', 'height', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth'],
    values: ['contain-floats', 'fill-available', 'fit-content', 'max-content', 'min-content']
  }
]
// The flexbox zoo
// (`flex-direction` => `box-orient` + `box-direction` is covered in main.js)
//
// ## Specs:
// - flex    (final):     https://www.w3.org/TR/css-flexbox-1/
// - flexbox (2012/ie10): https://www.w3.org/TR/2012/WD-css3-flexbox-20120322/
// - box     (2009/old):  https://www.w3.org/TR/2009/WD-css3-flexbox-20090723/
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
  'flex': 'box-flex', // https://css-tricks.com/snippets/css/a-guide-to-flexbox/#comment-371025,
  'flex-direction' : 'box-direction',// https://css-tricks.com/snippets/css/a-guide-to-flexbox/#comment-371025,
  'flex-wrap': 'box-lines',
  'order': 'box-ordinal-group' // https://css-tricks.com/snippets/css/a-guide-to-flexbox/#comment-371025
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

  // build a map of {propertyI: {keywordJ: previxedKeywordJ, ...}, ...}
  for (var i = 0; i < keywords.length; i++) {
    var map = {}, property = keywords[i].props[0]
    // eslint-disable-next-line
    for (var j = 0, keyword; keyword = keywords[i].values[j]; j++) {

      if (
        !supportedDecl(property, keyword) &&
        supportedDecl(property, fixers.prefix + keyword)
      ) {
        fixers.hasKeywords = true
        map[keyword] = fixers.prefix + keyword
      }
    }
    // eslint-disable-next-line
    for (j = 0; property = keywords[i].props[j]; j++) {
      fixers.keywords[deCamelCase(property)] = map
    }
  }
  if (fixers.keywords.display && fixers.keywords.display.flexbox) {
    // old IE
    fixers.keywords.display.flex = fixers.keywords.display.flexbox
    for (var k in ieAltProps) {
      fixers.properties[k] = ieAltProps[k]
      fixers.keywords[k] = ieAltValues
    }
  } else if (fixers.keywords.display && fixers.keywords.display.box) {
    // old flexbox spec
    fixers.keywords.display.flex = fixers.keywords.display.box
    fixers.oldFlexBox = true
    for (k in oldAltProps) {
      fixers.properties[k] = fixers.prefix + oldAltProps[k]
      fixers.keywords[k] = oldAltValues
    }
  }
  if (
    !supportedDecl('color', 'initial') &&
    supportedDecl('color', fixers.prefix + 'initial')
  ) {
    // `initial` does not use the `hasKeywords` branch.
    fixers.initial = fixers.prefix + 'initial'
  }
}
