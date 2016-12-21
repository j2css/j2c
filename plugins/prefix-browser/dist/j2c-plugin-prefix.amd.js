define(function () { 'use strict';

  var self = {prefix: ''}

  var root = document.documentElement
  function camelCase(str) {
    return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase() }).replace('-','')
  }
  function deCamelCase(str) {
    return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() })
  }
  function prefixSelector(selector) {
    return selector.replace(/^::?/, function($0) { return $0 + self.prefix })
  }

  if (typeof getComputedStyle === 'function') new function() {
  	var prefixes = {},
  	    properties = [],
  	    shorthands = {},
  	    style = getComputedStyle(document.documentElement, null),
  	    dummy = document.createElement('div').style;
  	// Why are we doing this instead of iterating over properties in a .style object? Because Webkit.
  	// 1. Older Webkit won't iterate over those.
  	// 2. Recent Webkit will, but the 'Webkit'-prefixed properties are not enumerable. The 'webkit'
  	//    (lower case 'w') ones are, but they don't `deCamelCase()` into a prefix that we can detect.
  	
  	var iterate = function(property) {
  	    if(property.charAt(0) === '-') {
  	        properties.push(property);
  	        
  	        var parts = property.split('-'),
  	            prefix = parts[1];
  	            
  	        // Count prefix uses
  	        prefixes[prefix] = ++prefixes[prefix] || 1;
  	        
  	        // This helps determining shorthands
  	        while(parts.length > 3) {
  	            parts.pop();
  	            
  	            var shorthand = parts.join('-');
  	
  	            if(supported(shorthand) && properties.indexOf(shorthand) === -1) {
  	                properties.push(shorthand);
  	            }
  	        }
  	    }
  	},
  	supported = function(property) {
  	    return camelCase(property) in dummy;
  	}
  	// Some browsers have numerical indices for the properties, some don't
  	if(style && style.length > 0) {
  	    for(var i=0; i<style.length; i++) {
  	        iterate(style[i])
  	    }
  	}
  	else {
  	    for(var property in style) {
  	        iterate(deCamelCase(property));
  	    }
  	}
  	// Find most frequently used prefix
  	var highest = {uses:0};
  	for(var prefix in prefixes) {
  	    var uses = prefixes[prefix];
  	
  	    if(highest.uses < uses) {
  	        highest = {prefix: prefix, uses: uses};
  	    }
  	}
  	self.prefix = '-' + highest.prefix + '-';
  	self.Prefix = camelCase(self.prefix);
  	self.properties = [];
  	// Get properties ONLY supported with a prefix
  	for(var i=0; i<properties.length; i++) {
  	    var property = properties[i];
  	    
  	    if(property.indexOf(self.prefix) === 0) { // we might have multiple prefixes, like Opera
  	        var unprefixed = property.slice(self.prefix.length);
  	        
  	        if(!supported(unprefixed)) {
  	            self.properties.push(unprefixed);
  	        }
  	    }
  	}
  	// IE fix
  	if(self.Prefix == 'Ms' 
  	  && !('transform' in dummy) 
  	  && !('MsTransform' in dummy) 
  	  && ('msTransform' in dummy)) {
  	    self.properties.push('transform', 'transform-origin');	
  	}
  	self.properties.sort();
  }

  if (typeof getComputedStyle === 'function') new function() {
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
  	};
  	functions['repeating-linear-gradient'] =
  	functions['repeating-radial-gradient'] =
  	functions['radial-gradient'] =
  	functions['linear-gradient'];
  	// Note: The properties assigned are just to *test* support. 
  	// The keywords will be prefixed everywhere.
  	var keywords = {
  		'initial': 'color',
  		'zoom-in': 'cursor',
  		'zoom-out': 'cursor',
  		'box': 'display',
  		'flexbox': 'display',
  		'inline-flexbox': 'display',
  		'flex': 'display',
  		'inline-flex': 'display',
  		'grid': 'display',
  		'inline-grid': 'display',
  		'max-content': 'width',
  		'min-content': 'width',
  		'fit-content': 'width',
  		'fill-available': 'width'
  	};
  	self.functions = [];
  	self.keywords = [];
  	var style = document.createElement('div').style;
  	function supported(value, property) {
  		style[property] = '';
  		style[property] = value;
  	
  		return !!style[property];
  	}
  	for (var func in functions) {
  		var test = functions[func],
  			property = test.property,
  			value = func + '(' + test.params + ')';
  		
  		if (!supported(value, property)
  		  && supported(self.prefix + value, property)) {
  			// It's supported, but with a prefix
  			self.functions.push(func);
  		}
  	}
  	for (var keyword in keywords) {
  		var property = keywords[keyword];
  	
  		if (!supported(keyword, property)
  		  && supported(self.prefix + keyword, property)) {
  			// It's supported, but with a prefix
  			self.keywords.push(keyword);
  		}
  	}
  }

  if (typeof getComputedStyle === 'function') new function() {
  	var 
  	selectors = {
  		':read-only': null,
  		':read-write': null,
  		':any-link': null,
  		'::selection': null
  	},
  	
  	atrules = {
  		'keyframes': 'name',
  		'viewport': null,
  		'document': 'regexp(".")'
  	};
  	self.selectors = [];
  	self.atrules = [];
  	var style = root.appendChild(document.createElement('style'));
  	function supported(selector) {
  		style.textContent = selector + '{}';  // Safari 4 has issues with style.innerHTML
  		
  		return !!style.sheet.cssRules.length;
  	}
  	for(var selector in selectors) {
  		var test = selector + (selectors[selector]? '(' + selectors[selector] + ')' : '');
  			
  		if(!supported(test) && supported(prefixSelector(test))) {
  			self.selectors.push(selector);
  		}
  	}
  	for(var atrule in atrules) {
  		var test = atrule + ' ' + (atrules[atrule] || '');
  		
  		if(!supported('@' + test) && supported('@' + self.prefix + test)) {
  			self.atrules.push(atrule);
  		}
  	}
  	root.removeChild(style);
  }

  if (typeof getComputedStyle === 'function') new function() {
  	// Properties that accept properties as their value
  	self.valueProperties = [
  		'transition',
  		'transition-property',
  		'will-change'
  	]
  	// Add class for current prefix
  	root.className += ' ' + self.prefix;
  }

  var prefixPlugin = function() {}

  if (typeof getComputedStyle === 'function') {

    var own = {}.hasOwnProperty

    function setify(ary){
      var res = {}
      ary.forEach(function(p) {res[p] = true})
      return res
    }

    var prefix = self.prefix

    var replacerString = '$&'+prefix

    var atRulesSet = setify(self.atrules.map(function(r){return '@'+r}))
    var atRulesMatcher = new RegExp('^@('+self.atrules.join('|')+')\\b')
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

    var selectorMatcher = makeLexer('\\b', self.selectors, '\\b')
    var selectorReplacer = function(match, $1, $2) {
      return $1 + $2.replace(/^::?/, replacerString)
    }

    var propertiesSet = setify(self.properties)

    // If this were ever updated, verify that the next comment is still valid.
    var valueProperties = {
      'transition': 1,
      'transition-property': 1
    }

    // Gradients are supported with a prefix, convert angles to legacy
    var convertGradients = self.functions.indexOf('linear-gradient') > -1
    var gradientDetector = /\blinear-gradient\(/
    var gradientMatcher = /(^|\s|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig
    var gradientReplacer = function ($0, delim, repeating, deg) {
      return delim + prefix + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg'
    }
    if (convertGradients) self.function.splice(self.functions.indexOf('linear-gradient'))
    if (self.functions.indexOf('repeating-linear-gradient') > -1) self.function.splice(self.functions.indexOf('repeating-linear-gradient'))


    // value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value);
    var convertFunctions = !!self.functions.length
    var functionsDetector = makeDetector('(?:^|\\s|,)', self.fuctions, '\\s*\\(')
    var functionsMatcher = makeLexer('(^|\\s|,)', self.fuctions, '\\s*\\(')
    // use the default replacer


    // value = fix('keywords', '(^|\\s)', '(\\s|$)', '$1' + self.prefix + '$2$3', value);
    var convertKeywords = !!self.keywords.length
    var keywordsDetector = makeDetector('(?:^|\\s)', self.keywords, '(?:\\s|$)')
    var keywordsMatcher  = makeLexer('(^|\\s)', self.keywords, '(?:\\s|$)')
    // use the default replacer


    // value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value);
    // No need to look for strings in these properties. We may insert prefixes in comments. Oh the humanity.
    var convertProperties = !!self.properties.length
    var valuePropertiesDetector = makeDetector('(?:^|\\s|,)', self.properties, '(?:$|\\s|,)')
    var valuePropertiesMatcher = new RegExp('(^|\\s|,)((?:' + self.properties.join('|') + ')(?:$|\\s|,))','gi')
    var valuePropertiesReplacer = '$1' + self.prefix + '$2'


    function fixValue (value, property) {
      if (convertGradients && gradientDetector.test(value)) value = value.replace(gradientMatcher, gradientReplacer)
      if (convertFunctions && functionsDetector.test(value)) value = value.replace(functionsMatcher, replacer)
      if (convertKeywords && keywordsDetector.test(value)) value = value.replace(keywordsMatcher, replacer)

      if (convertProperties && own.call(valueProperties, property) && valuePropertiesDetector.test(value)) {
        value = value.replace(valuePropertiesMatcher, valuePropertiesReplacer)
      }
      return value
    }

    prefixPlugin = function prefixPlugin() {
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

  var prefixPlugin$1 = prefixPlugin

  return prefixPlugin$1;

});