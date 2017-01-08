// Derived from Lea Verou's PrefixFree

import {supportedDecl} from './utils.js'

export function detectFunctions(fixers) {
  // Values that might need prefixing
  if (fixers.prefix === '') return
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

  // build an array of prefixable functions
  for (var func in functions) {
    var test = functions[func],
      property = test.property,
      value = func + '(' + test.params + ')'

    if (!supportedDecl(property, value) && supportedDecl(property, fixers.prefix + value)) {
      // It's only supported with a prefix
      fixers.functions.push(func)
    }
  }
}