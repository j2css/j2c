import {fixers} from './fixers.js'
import './extracted/decorateFixers.js'
var own = {}.hasOwnProperty

function setify(ary){
  var res = {}
  ary.forEach(function(p) {res[p] = true})
  return res
}

var prefix = fixers.prefix

var replacerString = '$&'+prefix

var atRulesSet = setify(fixers.atrules.map(function(r){return '@'+r}))

var atRulesMatcher = new RegExp('^@('+fixers.atrules.join('|')+')\\b')
var atRulesReplacer = '@' + prefix + '$1'

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

function replacer (match, $1, $2) {
  if (!$1) return match
  return $1 + prefix + $2
}

var selectorMatcher = makeLexer('\\b(', fixers.selectors, ')\\b')
var selectorReplacer = makeReplacer(/^::?/, replacerString)

var propertiesSet = setify(fixers.properties)

// If this were ever updated, verify that the next comment is still valid.
var valueProperties = {
  'transition': 1,
  'transition-property': 1
}

// Gradients are supported with a prefix, convert angles to legacy
var convertGradients = fixers.functions.indexOf('linear-gradient') > -1
var gradientDetector = /\blinear-gradient\(/
var gradientMatcher = /(^|\s|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig
var gradientReplacer = function ($0, delim, repeating, deg) {
  return delim + prefix + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg'
}
if (convertGradients) fixers.function.splice(fixers.functions.indexOf('linear-gradient'))
if (fixers.functions.indexOf('repeating-linear-gradient') > -1) fixers.function.splice(fixers.functions.indexOf('repeating-linear-gradient'))

// value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value);
var convertFunctions = !!fixers.functions.length
var functionsDetector = makeDetector('(?:^|\\s|,)', fixers.fuctions, '\\s*\\(')
var functionsMatcher = makeLexer('(^|\\s|,)', fixers.fuctions, '\\s*\\(')

// value = fix('keywords', '(^|\\s)', '(\\s|$)', '$1' + self.prefix + '$2$3', value);
var convertKeywords = !!fixers.keywords.length
var keywordsDetector = makeDetector('(?:^|\\s)', fixers.keywords, '(?:\\s|$)')
var keywordsMatcher  = makeLexer('(^|\\s)', fixers.keywords, '(?:\\s|$)')

// No need to look for strings in these properties. We may insert prefixes in comments. Oh the humanity.
// value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value);
var convertProperties = !!fixers.properties.length
var valuePropertiesDetector = makeDetector('(?:^|\\s|,)', fixers.properties, '(?:$|\\s|,)')
var valuePropertiesMatcher = new RegExp('(^|\\s|,)((?:' + fixers.properties.join('|') + ')(?:$|\\s|,))','gi')
var valuePropertiesReplacer = '$1' + fixers.prefix + '$2'

function fixValue (value, property) {
  if (convertGradients && gradientDetector.test(value)) value = value.replace(gradientMatcher, gradientReplacer)
  if (convertFunctions && functionsDetector.test(value)) value = value.replace(functionsMatcher, replacer)
  if (convertKeywords && keywordsDetector.test(value)) value = value.replace(keywordsMatcher, replacer)

  if (convertProperties && own.call(valueProperties, property) && valuePropertiesDetector.test(value)) {
    value = value.replace(valuePropertiesMatcher, valuePropertiesReplacer)
  }
  return value
}

export default function prefixPlugin() {
  if(window.addEventListener) {
    return {
      $filter: function(next) {
        var atStack = []
        return {
          i: function() {
            next.i()
            atStack.length = 0
          },
          a: function(rule, params, hasBlock) {
            rule = own.call(atRulesSet, rule) ? rule.replace(atRulesMatcher, atRulesReplacer) : rule
            if (hasBlock) atStack.push(rule)
            next.a(
              rule,
              params,
              hasBlock
            )
          },
          A: function() {
            next.A(atStack.pop())
          },
          d: function(property, value){
            next.d(
              own.call(propertiesSet, property) ? prefix + property : property,
              fixValue(value, property)
            )
          },
          s: function(selector) {
            if (selectorMatcher.test(selector)) selector = selector.replace(selectorMatcher, selectorReplacer)
            next.s(selector)
          }
        }
      }
    }
  }
}
