import {own, type, ARRAY, OBJECT} from './helpers'

function decamelize(match) {
  return '-' + match.toLowerCase()
}

// Handles the property:value; pairs.
export function declarations(o, buf, prefix, vendors, localize, selector, /*var*/ k, v, kk) {
  if (o==null) return
  switch ( type.call(o = o.valueOf()) ) {
  case ARRAY:
    for (k = 0; k < o.length; k++)
      declarations(o[k], buf, prefix, vendors, localize, selector)
    break
  case OBJECT:
    prefix = (prefix && prefix + '-')
    for (k in o) if (own.call(o, k)){
      v = o[k]
      if (k.indexOf('$') + 1) {
        // "$" was found.
        for (kk in (k = k.split('$'))) if (own.call(k, kk))
          declarations(v, buf, prefix + k[kk], vendors, localize, selector)
      } else {
        declarations(v, buf, prefix + k, vendors, localize, selector)
      }
    }
    break
  default:
    // extend:
    if(localize && selector && prefix === 'extend') {
      if (!/^\s*\.[-\w]+\s*$/.test(selector)) {
        throw new Error ("`extend` applies only to local classes, got '"+selector+"'")
      }
      o = o.replace(/()(?::global\(\s*\.([-\w]+)\s*\)|()\.([-\w]+))/, localize)
      localize(o, prefix, o, o, selector.match(/[-\w]+/))
      break
    }

    // prefix is falsy when it is "", which means that we're
    // at the top level.
    // `o` is then treated as a `property:value` pair.
    // otherwise, `prefix` is the property name, and
    // `o` is the value.
    k = (prefix && (prefix).replace(/_/g, '-').replace(/[A-Z]/g, decamelize) + ':')

    if (localize && (k == 'animation-name:' || k == 'animation:')) {
      o = o.split(',').map(function(o){
        return o.replace(/()(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/, localize)
      }).join(',')
    }

/*/-statements-/*/
    o = k + o + ';'

    // vendorify
    for (kk = 0; kk < vendors.length; kk++)
      buf.push('-' + vendors[kk] + '-' + o)
    buf.push(o)
/*/-statements-/*/
/*/-inline-/*/
    // buf.push(k + o + ";");
/*/-inline-/*/

  }
}
