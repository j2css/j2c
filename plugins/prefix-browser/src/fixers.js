import {init, finalize, supportedProperty}   from './detectors/utils.js'
import {detectAtrules}    from './detectors/atrules.js'
import {detectFunctions}  from './detectors/functions.js'
import {detectKeywords}   from './detectors/keywords.js'
import {detectPrefix}     from './detectors/prefix.js'
import {detectSelectors}  from './detectors/selectors.js'


export function blankFixers() {
  return {
    atrules: {},
    hasAtrules: false,
    hasDppx: null,
    hasFunctions: false,
    hasKeywords: false,
    hasPixelRatio: false,
    hasPixelRatioFraction: false,
    hasSelectors: false,
    hasValues: false,
    fixAtMediaParams: null,
    fixAtSupportsParams: null,
    fixProperty: null,
    fixSelector: null,
    fixValue: null,
    functions: [],
    initial: null,
    keywords: {},
    oldFlexBox: false,
    prefix: '',
    Prefix: '',
    properties: {},
    selectors: [],
    valueProperties: {
      'transition': 1,
      'transition-property': 1,
      'will-change': 1
    }
  }
}


export function browserDetector(fixers) {
  // add the required data to the fixers object.
  init()
  detectPrefix(fixers)
  detectSelectors(fixers)
  detectAtrules(fixers)
  detectKeywords(fixers)
  detectFunctions(fixers)
  finalize()
}

var emptySet = {}
var own = {}.hasOwnProperty

var valueTokenizer = /[(),]|\/\*[\s\S]*?\*\//g


/**
 * For properties whose values are also properties, this will split a coma-separated
 * value list into individual values, ignoring comas in comments and in
 * functions(parameter, lists).
 *
 * @param {string} selector
 * @return {string[]}
 */

function splitValue(value) {
  var indices = [], res = [], inParen = 0, o
  /*eslint-disable no-cond-assign*/
  while (o = valueTokenizer.exec(value)) {
  /*eslint-enable no-cond-assign*/
    switch (o[0]) {
    case '(': inParen++; break
    case ')': inParen--; break
    case ',': if (inParen) break; indices.push(o.index)
    }
  }
  for (o = indices.length; o--;){
    res.unshift(value.slice(indices[o] + 1))
    value = value.slice(0, indices[o])
  }
  res.unshift(value)
  return res
}

function makeDetector (before, targets, after) {
  return new RegExp(before + '(?:' + targets.join('|') + ')' + after)
}

function makeLexer (before, targets, after) {
  return new RegExp(
        "\"(?:\\\\[\\S\\s]|[^\"])*\"|'(?:\\\\[\\S\\s]|[^'])*'|\\/\\*[\\S\\s]*?\\*\\/|" +
            before + '((?:' +
            targets.join('|') +
            '))' + after,
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

  var selectorDetector = makeDetector('', fixers.selectors, '(?:\\b|$|[^-])')
  var selectorMatcher = makeLexer('', fixers.selectors, '(?:\\b|$|[^-])')
  var selectorReplacer = function(match, $1) {
    return $1 !=null ? $1.replace(/^::?/, replacerString) : match
  }

  // Gradients are supported with a prefix, convert angles to legacy
  var gradientDetector = /\blinear-gradient\(/
  var gradientMatcher = /(^|\s|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig
  var gradientReplacer = function ($0, delim, repeating, deg) {
    return delim + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg'
  }

  // value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value);
  var functionsDetector = makeDetector('(?:^|\\s|,)', fixers.functions, '\\s*\\(')
  var functionsMatcher = makeLexer('(^|\\s|,)', fixers.functions, '\\s*\\(')
  // use the default replacer


  // value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value);
  // No need to look for strings in these properties. We may insert prefixes in comments. Oh the humanity.
  var valuePropertiesMatcher = /^\s*([-\w]+)/gi
  var valuePropertiesReplacer = function(match, prop){
    return fixers.properties[prop] || fixers.fixProperty(prop)
  }

  fixers.fixProperty = function(prop) {
    var prefixed
    return fixers.properties[prop] = (
      supportedProperty(prop) ||
      !supportedProperty(prefixed = this.prefix + prop)
    ) ? prop : prefixed
  }

  var resolutionMatcher = /((?:min-|max-)?resolution)\s*:\s*((?:\d*.)?\d+)dppx/g
  var resolutionReplacer = (
    fixers.hasPixelRatio ? function(_, prop, param){return fixers.properties[prop] + ':' + param} :
    fixers.hasPixelRatioFraction ? function(_, prop, param){return fixers.properties[prop] + ':' + Math.round(param*10) + '/10'} :
    function(_, prop, param){return prop + ':' + Math.round(param * 96) +'dpi'}
  )
  fixers.fixAtMediaParams = fixers.hasDppx !== false /*it may be null*/ ?
    function(p) {return p} :
    function (params) {
      return (params.indexOf('reso') !== -1) ?
        params.replace(resolutionMatcher, resolutionReplacer) :
        params
    }

  // comments not supported here. See https://www.debuggex.com/r/a3oAc6Y07xuknSVg
  var atSupportsParamsMatcher = /\(\s*([-\w]+)\s*:\s*((?:"(?:\\[\S\s]|[^"])*"|'(?:\\[\S\s]|[^'])*'|\/\*[\S\s]*?\*\/|\((?:"(?:\\[\S\s]|[^"])*"|'(?:\\[\S\s]|[^'])*'|\/\*[\S\s]*?\*\/|\((?:"(?:\\[\S\s]|[^"])*"|'(?:\\[\S\s]|[^'])*'|\/\*[\S\s]*?\*\/|\((?:"(?:\\[\S\s]|[^"])*"|'(?:\\[\S\s]|[^'])*'|\/\*[\S\s]*?\*\/|\((?:"(?:\\[\S\s]|[^"])*"|'(?:\\[\S\s]|[^'])*'|\/\*[\S\s]*?\*\/|\([^\)]*\)|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*)/g
  function atSupportsParamsReplacer(match, prop, value) {
    return '(' + (fixers.properties[prop] || fixers.fixProperty(prop)) + ':' + fixers.fixValue(value, prop)
  }
  fixers.fixAtSupportsParams = function(params) {
    return params.replace(atSupportsParamsMatcher, atSupportsParamsReplacer)
  }

  fixers.fixSelector = function(selector) {
    return selectorDetector.test(selector) ? selector.replace(selectorMatcher, selectorReplacer) : selector
  }

  fixers.fixValue = function (value, property) {
    var res = value
    if (fixers.initial != null && value === 'initial') return fixers.initial

    if (fixers.hasKeywords && (res = (fixers.keywords[property] || emptySet)[value])) return res

    if (own.call(fixers.valueProperties, property)) {
      if (value.indexOf(',') === -1) {
        return value.replace(valuePropertiesMatcher, valuePropertiesReplacer)
      } else {
        return splitValue(value).map(function(v) {
          return v.replace(valuePropertiesMatcher, valuePropertiesReplacer)
        }).join(',')
      }
    }
    if (fixers.hasGradients && gradientDetector.test(value)) res = value.replace(gradientMatcher, gradientReplacer)
    if (fixers.hasFunctions && functionsDetector.test(value)) res = value.replace(functionsMatcher, replacer)
    return res
  }

}
