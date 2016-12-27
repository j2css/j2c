(function (exports) {
  'use strict';

  // Derived from Lea Verou's PrefixFree

  var allStyles;
  var styleAttr;
  var styleElement;
  function init() {
    allStyles = getComputedStyle(document.documentElement, null),
    styleAttr = document.createElement('div').style
    styleElement = document.documentElement.appendChild(document.createElement('style'))
  }
  function finalize() {
    document.documentElement.removeChild(styleElement)
    allStyles = styleAttr = styleElement = null
  }

  // Helpers, in alphabetic order

  function camelCase(str) {
    return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase() }).replace('-','')
  }
  function deCamelCase(str) {
    return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() })
  }
  function supportedDecl(property, value) {
    styleElement[property] = ''
    styleElement[property] = value
    return !!styleElement[property]
  }
  function supportedProperty(property) {
    return camelCase(property) in styleAttr
  }
  function supportedRule(selector) {
    styleElement.textContent = selector + '{}'
    return !!styleElement.sheet.cssRules.length
  }

  function detectAtrules(fixers) {
    if (fixers.prefix === '') return
    var atrules = {
      'keyframes': 'name',
      'viewport': null,
      'document': 'regexp(".")'
    }
    for(var atrule in atrules) {
      var test = atrule + ' ' + (atrules[atrule] || '')

      if(!supportedRule('@' + test) && supportedRule('@' + self.prefix + test)) {
        fixers.fixAtrules = true
        fixers.atrules['@' + atrule] = fixers.prefix + atrule
      }
    }
  }

  function detectFunctions(fixers) {
    // Values that might need prefixing
    var functions = {
      'linear-gradient': {
        property: 'backgroundImage',
        params: 'red, teal'
      },
      'calc': {
        property: 'width',
        params: '1px + 5%'
      },
      'element': {
        property: 'backgroundImage',
        params: '#foo'
      },
      'cross-fade': {
        property: 'backgroundImage',
        params: 'url(a.png), url(b.png), 50%'
      }
    }
    functions['repeating-linear-gradient'] =
    functions['repeating-radial-gradient'] =
    functions['radial-gradient'] =
    functions['linear-gradient']

    for (var func in functions) {
      var test = functions[func],
        property = test.property,
        value = func + '(' + test.params + ')'

      if (!supportedDecl(property, value) && supportedDecl(property, self.prefix + value)) {
        // It's only supported with a prefix
        fixers.functions.push(func)
      }
    }
  }

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

  function detectKeywords(fixers) {
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

  function detectPrefix(fixers) {
    var prefixCounters = {}
    var properties = fixers.propertyList
    // Why are we doing this instead of iterating over properties in a .style object? Because Webkit.
    // 1. Older Webkit won't iterate over those.
    // 2. Recent Webkit will, but the 'Webkit'-prefixed properties are not enumerable. The 'webkit'
    //    (lower case 'w') ones are, but they don't `deCamelCase()` into a prefix that we can detect.

    function iteration(property) {
      if(property.charAt(0) === '-') {
        properties.push(property)

        var parts = property.split('-'),
          prefix = parts[1]

        // Count prefix uses
        prefixCounters[prefix] = ++prefixCounters[prefix] || 1

        // This helps determining shorthands
        while(parts.length > 3) {
          parts.pop()

          var shorthand = parts.join('-')

          if (supportedProperty(shorthand)) {
            properties.push(shorthand)
          }
        }
      }
    }

    // Some browsers have numerical indices for the properties, some don't
    if(allStyles && allStyles.length > 0) {
      for(var i=0; i<allStyles.length; i++) {
        iteration(allStyles[i])
      }
    }
    else {
      for(var property in allStyles) {
        iteration(deCamelCase(property))
      }
    }

    var highest = 0
    for(var prefix in prefixCounters) {

      if(highest < prefixCounters[prefix]) {
        highest = prefixCounters[prefix]
        fixers.prefix = '-' + prefix + '-'
      }
    }
    fixers.Prefix = camelCase(fixers.prefix)
  }

  function detectProperties(fixers) {
    if (fixers.prefix === '') return

    var properties = fixers.propertyList
    // Get properties ONLY supported with a prefix
    for(var i=0; i<properties.length; i++) {
      var property = properties[i]

      if(property.indexOf(fixers.prefix) === 0) { // we might have multiple prefixes, like Opera
        var unprefixed = property.slice(fixers.prefix.length)

        if(!supportedProperty(unprefixed)) {
          fixers.fixProperties = true
          fixers.properties[unprefixed] = property
        }
      }
    }
    // IE fix
    if(fixers.Prefix == 'Ms'
      && !('transform' in styleElement)
      && !('MsTransform' in styleElement)
      && ('msTransform' in styleElement)) {
      fixers.fixProperties = true
      fixers.properties['transform'] = '-ms-transform'
      fixers.properties['transform-origin'] = '-ms-transform-origin'
    }
  }

  function detectSelectors(fixers) {
    function prefixSelector(selector) {
      return selector.replace(/^::?/, function($0) { return $0 + fixers.prefix })
    }

    if (fixers.prefix === '') return
    var selectors = {
      ':read-only': 1,
      ':read-write': 1,
      ':any-link': 1,
      '::selection': 1
    }
    for(var selector in selectors) {
      if(!supportedRule(selector) && supportedRule(prefixSelector(selector))) {
        fixers.fixSelectors = true
        fixers.selectors.push(selector)
      }
    }
  }

  function blankFixers() {
    return {
      atrules: {},
      hasAtrules: false,
      hasFunctions: false,
      hasKeywords: false,
      hasProperties: false,
      hasSelectors: false,
      hasValues: false,
      fixAtruleParams: null,
      fixSelector: null,
      fixValue: null,
      functions: [],
      initial: null,
      keywords: {},
      oldFlexBox: false,
      prefix: '',
      Prefix: '',
      properties: {},
      propertyList : [],
      selectors: [],
      valueProperties: {
        'transition': 1,
        'transition-property': 1,
        'will-change': 1
      }
    }
  }

  function browserDetector(fixers) {
    // add the required data to the fixers object.
    init()
    detectPrefix(fixers)
    detectProperties(fixers)
    detectSelectors(fixers)
    detectAtrules(fixers)
    detectKeywords(fixers)
    detectFunctions(fixers)
    finalize()
  }

  var emptySet = {}
  var own = {}.hasOwnProperty


  function makeDetector (before, targets, after) {
    return new RegExp(before + '(?:' + targets.join('|') + ')' + after)
  }

  function makeLexer (before, targets, after) {
    new RegExp(
          "\"(?:\\\\[\\S\\s]|[^\"])*\"|'(?:\\\\[\\S\\s]|[^'])*'|\\/\\*[\\S\\s]*?\\*\\/|" +
              before + '((?:' +
              targets.join('|') +
              ')' + after + ')',
          'gi'
      )
  }


  function finalizeFixers(fixers) {
    var prefix = fixers.prefix

    var replacerString = '$&'+prefix

    function replacer (match, $1, $2) {
      if (!$1) return match
      return $1 + prefix + $2
    }

    var selectorMatcher = makeLexer('\\b', fixers.selectors, '\\b')
    var selectorReplacer = function(match, $1, $2) {
      return $1 + $2.replace(/^::?/, replacerString)
    }

    // Gradients are supported with a prefix, convert angles to legacy
    var gradientDetector = /\blinear-gradient\(/
    var gradientMatcher = /(^|\s|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig
    var gradientReplacer = function ($0, delim, repeating, deg) {
      return delim + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg'
    }

    // value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value);
    var functionsDetector = makeDetector('(?:^|\\s|,)', fixers.fuctions, '\\s*\\(')
    var functionsMatcher = makeLexer('(^|\\s|,)', fixers.fuctions, '\\s*\\(')
    // use the default replacer


    // value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value);
    // No need to look for strings in these properties. We may insert prefixes in comments. Oh the humanity.
    var valuePropertiesDetector = makeDetector('(?:^|\\s|,)', fixers.properties, '(?:$|\\s|,)')
    var valuePropertiesMatcher = new RegExp('(^|\\s|,)((?:' + fixers.properties.join('|') + ')(?:$|\\s|,))','gi')
    var valuePropertiesReplacer = '$1' + fixers.prefix + '$2'

    fixers.fixAtruleParams = function (kind, params) {
      // TODO
      // - prefix @supports properties and values
      // - prefix pixel density-related media queries.
      return params
    }

    fixers.fixSelector = function(selector) {
      return selectorMatcher.test(selector) ? selector.replace(selectorMatcher, selectorReplacer) : selector
    }

    fixers.hasValues = fixers.hasFunctions || fixers.hasGradients || fixers.hasKeywords || fixers.hasProperties
    fixers.fixValue = function (value, property) {
      var res = value
      if (fixers.initial !== null && value === 'initial') return fixers.initial

      if (fixers.hasKeywords && (res = (fixers.keywords[property] || emptySet)[value])) return res

      if (fixers.hasProperties && own.call(fixers.valueProperties, property) && valuePropertiesDetector.test(value)) {
        return value.replace(valuePropertiesMatcher, valuePropertiesReplacer)
      }
      if (fixers.hasGradients && gradientDetector.test(value)) res = value.replace(gradientMatcher, gradientReplacer)
      if (fixers.hasFunctions && functionsDetector.test(value)) res = value.replace(functionsMatcher, replacer)
      return res
    }

  }

  function createPrefixPlugin() {
    var fixers = blankFixers()
    if (typeof getComputedStyle === 'function') browserDetector(fixers)
    finalizeFixers(fixers)

    var cache = []

    prefixPlugin.setPrefix = function(f) {
      if (cache.indexOf(f) === -1) {
        finalizeFixers(f)
        cache.push(f)
      }
      fixers = f
    }

    function prefixPlugin() {
      return {
        $filter: function(next) {
          return {
            atrule: function(rule, kind, params, hasBlock) {
              next.atrule(
                fixers.fixAtrules && fixers.atrules[rule] || rule,
                kind,
                kind === 'supports' || kind === 'media' ? fixers.fixAtruleParams(kind, params): params,
                hasBlock
              )
            },
            decl: function(property, value) {
              if (fixers.oldFlexBox && property === 'flex-direction' && typeof value === 'string') {
                next.decl(fixers.properties['box-orient'], value.indexOf('column') > -1 ? 'vertical' : 'horizontal')
                next.decl(fixers.properties['box-direction'], value.indexOf('reverse') > -1 ? 'reverse' : 'normal')
              } else {
                next.decl(
                  fixers.hasProperties && fixers.properties[property] || property,
                  fixers.fixValue(value, property)
                )
              }
            },
            rule: function(selector) {
              next.rule(
                fixers.hasRules ? fixers.fixSelector(selector) : selector
              )
            }
          }
        }
      }
    }
    return prefixPlugin
  }

  exports.createPrefixPlugin = createPrefixPlugin;

}((this.j2cPrefixPluginBrowser = this.j2cPrefixPluginBrowser || {})));