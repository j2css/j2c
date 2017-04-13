export function global(x) {
  return ':global(' + x + ')'
}

export function kv (k, v, o) {
  o = {}
  o[k] = v
  return o
}

export function at (rule, params, block) {
  if (
    arguments.length < 3
  ) {
    // inner curry!
    var _at = at.bind.apply(at, Array.prototype.concat.apply([this], arguments))
    // So that it can be used as a key in an ES6 object literal.
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  return kv('@' + rule +' ' + params, block)
}