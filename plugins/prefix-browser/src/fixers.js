import {init, finalize, supportedProperty}   from './detectors/core.js'
import {detectAtrules}    from './detectors/atrules.js'
import {detectFunctions}  from './detectors/functions.js'
import {detectKeywords}   from './detectors/keywords.js'
import {detectPrefix}     from './detectors/prefix.js'
import {detectSelectors}  from './detectors/selectors.js'
import {detectWebkitCompat} from './detectors/webkit-compat'

export function blankFixers() {
  return {
    atrules: {},
    hasAtrules: false,
    hasDppx: null,
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
    flexbox2009: false,
    flexbox2012: false,
    functions: [],
    initial: null,
    jsFlex: false,
    keywords: {},
    placeholder: null,
    prefix: '',
    prefixes: [],
    Prefix: '',
    properties: {},
    selectorList: [],
    selectorMap: {},
    valueProperties: {
      'transition': 1,
      'transition-property': 1,
      'will-change': 1
    },
    WkBCTxt: false // -webkit-background-clip: text
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
  detectWebkitCompat(fixers)
  finalize()
}

var emptySet = {}

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

// declarations
// ------------
// function trim(s) {
//   return s.replace(/^\s*(.*?)\s*$/, '$1')
// }

export function fixDecl(fixers, emit, property, value) {
  if (typeof property !== 'string' || property.charAt(0) === '-') return emit(property, value)

  if (!(typeof value === 'string' || typeof value === 'number')){
    return emit(fixers.properties[property] || fixers.fixProperty(property), value)
  }

  value = value + ''
  if (fixers.jsFlex) {
    if (property === 'display' && (value === 'flex' || value === 'inline-flex')) {
      emit('-js-display', value)
      return
    }
  } else if (fixers.flexbox2009) {
      // TODO: flex only takes one value in the 2009 spec
    // if (property === 'flex') {
    //   value = trim(value)
    //   if (value === 'none' || value === 'initial') emit(property, '0')
    //   else if (value === 'auto') emit(property, '1')
    //   else emit(property, value.replace(/^(\d+)(?=\W|$).*/, '$1'))
    //   return
    // } else
    if (property === 'flex-flow') {
      value.split(/\s+/).forEach(function(v){
        // recurse! The lack of `next.` is intentional.
        if (v.indexOf('wrap') > -1) fixDecl(fixers, emit, 'flex-wrap', v)
        else if(v !== '') fixDecl(fixers, emit, 'flex-direction', v)
      })
      return
    } else if (property === 'flex-direction') {
      emit(fixers.properties['box-orient'], value.indexOf('column') > -1 ? 'block-axis' : 'inline-axis')
      emit(fixers.properties['box-direction'], value.indexOf('-reverse') > -1 ? 'reverse' : 'normal')
      return
    }
  }
  // else if (fixers.flexbox2012) {
  //   // if (property === 'flex' && value.indexOf('calc(') !== -1) {
  //   //   var parsed =
  //   // }
  // }
  if(fixers.WkBCTxt && property === 'background-clip' && value === 'text') {
    emit('-webkit-background-clip', value)
  } else {
    emit(
      fixers.properties[property] || fixers.fixProperty(property),
      fixers.fixValue(value, property)
    )
  }
}


export function finalizeFixers(fixers) {
  var prefix = fixers.prefix


  // properties
  // ----------

  fixers.fixProperty = fixers.fixProperty || function(prop) {
    var prefixed
    return fixers.properties[prop] = (
      supportedProperty(prop) ||
      !supportedProperty(prefixed = prefix + prop)
    ) ? prop : prefixed
  }


  // selectors
  // ----------

  var selectorDetector = makeDetector('', fixers.selectorList, '(?:\\b|$|[^-])')
  var selectorMatcher = makeLexer('', fixers.selectorList, '(?:\\b|$|[^-])')
  var selectorReplacer = function(match, selector) {
    return selector != null ? fixers.selectorMap[selector] : match
  }
  fixers.fixSelector = function(selector) {
    return selectorDetector.test(selector) ? selector.replace(selectorMatcher, selectorReplacer) : selector
  }


  // values
  // ------

  // When gradients are supported with a prefix, convert angles to legacy
  // (from clockwise to trigonometric)
  var hasGradients = fixers.functions.indexOf('linear-gradient') > -1
  var gradientDetector = /\blinear-gradient\(/
  var gradientMatcher = /(^|\s|,|\()((?:repeating-)?linear-gradient\()\s*(-?\d*\.?\d*)deg/ig
  var gradientReplacer = function (match, delim, gradient, deg) {
    return delim + gradient + (90-deg) + 'deg'
  }

  // functions
  var hasFunctions = !!fixers.functions.length
  var functionsDetector = makeDetector('(?:^|\\s|,|\\()', fixers.functions, '\\s*\\(')
  var functionsMatcher = makeLexer('(^|\\s|,|\\()', fixers.functions, '(?=\\s*\\()')
  function functionReplacer (match, $1, $2) {
    return $1 + prefix + $2
  }

  // properties as values (for transition, ...)
  // No need to look for strings in these properties. We may insert prefixes in comments. Oh the humanity.
  var valuePropertiesMatcher = /^\s*([-\w]+)/gi
  var valuePropertiesReplacer = function(match, prop){
    return fixers.properties[prop] || fixers.fixProperty(prop)
  }

  fixers.fixValue = function (value, property) {
    var res
    if (fixers.initial != null && value === 'initial') return fixers.initial

    if (fixers.hasKeywords && (res = (fixers.keywords[property] || emptySet)[value])) return res

    res = value

    if (fixers.valueProperties.hasOwnProperty(property)) {
      res = (value.indexOf(',') === -1) ?
        value.replace(valuePropertiesMatcher, valuePropertiesReplacer) :
        splitValue(value).map(function(v) {
          return v.replace(valuePropertiesMatcher, valuePropertiesReplacer)
        }).join(',')
    }

    if (hasFunctions && functionsDetector.test(value)) {
      if (hasGradients && gradientDetector.test(value)) {
        res = res.replace(gradientMatcher, gradientReplacer)
      }
      res = res.replace(functionsMatcher, functionReplacer)
    }
    return res
  }

  // @media (resolution:...) {
  // -------------------------

  var resolutionMatcher = /((?:min-|max-)?resolution)\s*:\s*((?:\d*\.)?\d+)dppx/g
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


  // @supports ... {
  // ---------------

  var supportsProp, supportsValue
  var atSupportsParamsFixer = function (property, value) {
    supportsProp = property
    supportsValue = value
  }
  // regexp built by scripts/regexps.js
  var atSupportsParamsMatcher =  /\(\s*([-\w]+)\s*:\s*((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|\((?:'(?:\\[\S\s]|[^'])*'|"(?:\\[\S\s]|[^"])*"|\/\*[\S\s]*?\*\/|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*\)|[^\)])*)/g
  function atSupportsParamsReplacer(match, prop, value) {
    fixDecl(fixers, atSupportsParamsFixer, prop, value)
    return '(' + supportsProp + ':' + supportsValue
  }
  fixers.fixAtSupportsParams = function(params) {
    return params.replace(atSupportsParamsMatcher, atSupportsParamsReplacer)
  }
}
