import {own, type, ARRAY, OBJECT} from './helpers'

function decamelize(match) {
  return '-' + match.toLowerCase()
}

// Handles the property:value; pairs.
export function declarations(o, buf, prefix, vendors, local, ns, /*var*/ k, v, kk) {
  if (o==null) return
  if (/\$/.test(prefix)) {
    for (kk in (prefix = prefix.split('$'))) if (own.call(prefix, kk)) {
      declarations(o, buf, prefix[kk], vendors, local, ns)
    }
    return
  }
  switch ( type.call(o = o.valueOf()) ) {
  case ARRAY:
    for (k = 0; k < o.length; k++)
      declarations(o[k], buf, prefix, vendors, local, ns)
    break
  case OBJECT:
    // prefix is falsy iif it is the empty string, which means we're at the root
    // of the declarations list.
    prefix = (prefix && prefix + '-')
    for (k in o) if (own.call(o, k)){
      v = o[k]
      if (/\$/.test(k)) {
        for (kk in (k = k.split('$'))) if (own.call(k, kk))
          declarations(v, buf, prefix + k[kk], vendors, local, ns)
      } else {
        declarations(v, buf, prefix + k, vendors, local, ns)
      }
    }
    break
  default:
    // prefix is falsy when it is "", which means that we're
    // at the top level.
    // `o` is then treated as a `property:value` pair.
    // otherwise, `prefix` is the property name, and
    // `o` is the value.
    k = (prefix && (prefix).replace(/_/g, '-').replace(/[A-Z]/g, decamelize) + ':')

    if (local && (k == 'animation-name:' || k == 'animation:')) {
      o = o.split(',').map(function(o){
        return o.replace(/()(?::global\(\s*([-\w]+)\s*\)|()([-\w]+))/, ns.l)
      }).join(',')
      vendors = ['webkit']
    }
/*/-statements-/*/
    o = k + o + ';'

    // vendorify
    for (kk = 0; kk < vendors.length; kk++)
      buf.push('-' + vendors[kk] + '-' + o)
    buf.push(o.replace(/^@/, 'at-'))
/*/-statements-/*/
/*/-inline-/*/
    // buf.push(k + o + ";");
/*/-inline-/*/

  }
}
