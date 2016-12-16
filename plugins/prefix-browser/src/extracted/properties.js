import {fixers as self, camelCase, deCamelCase} from '../fixers.js';
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