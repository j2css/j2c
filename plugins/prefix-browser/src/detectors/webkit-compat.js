import {supportedDecl, supportedProperty} from './core'

export function detectWebkitCompat(fixers) {
  if (!supportedDecl('background-clip', 'text') && supportedDecl('-webkit-background-clip', 'text')) fixers.WkBCTxt = true
  ;['background-clip', 'text-fill-color', 'text-stroke-color', 'text-stroke-width', 'text-stroke'].forEach(function(prop){
    if(!supportedProperty(prop) && supportedProperty('-webkit-' + prop)) fixers.properties[prop] = '-webkit-' + prop
  })
}
