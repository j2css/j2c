export function blankFixers() {
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

import {init, finalize}   from './detectors/utils.js'
import {detectAtrules}    from './detectors/at-rules.js'
import {detectFunctions}  from './detectors/functions.js'
import {detectKeywords}   from './detectors/keywords.js'
import {detectPrefix}     from './detectors/prefix.js'
import {detectProperties} from './detectors/properties.js'
import {detectSelectors}  from './detectors/selectors.js'

export function browserDetector(fixers) {
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


export function finalizeFixers(fixers) {
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
