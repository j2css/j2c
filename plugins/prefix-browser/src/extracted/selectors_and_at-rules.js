import {fixers as self, root} from '../fixers.js';
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
		
	if(!supported(test) && supported(self.prefixSelector(test))) {
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