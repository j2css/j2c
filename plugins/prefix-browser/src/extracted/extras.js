import {root, fixers as self} from '../fixers.js'
// Properties that accept properties as their value
self.valueProperties = [
	'transition',
	'transition-property',
	'will-change'
]
// Add class for current prefix
root.className += ' ' + self.prefix;