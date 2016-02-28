import {own, flatIter, emptyArray, type, FUNCTION, OBJECT} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'
import {atRules} from './at-rules'

function global(x) {
  return ':global(' + x + ')'
}


function kv (k, v, o) {
  o = {}
  o[k] = v
  return o
}

function at (rule, params, block) {
  if (
    arguments.length < 3
  ) {
    // inner curry!
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    // So that it can be used as a key in an ES6 object literal.
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule +' ' + params, block)
}

export default function j2c() {
  var filters = []
  var atHandlers = []
  var instance = {
    at: at,
    global: global,
    kv: kv,
    names: {},
    suffix: '__j2c-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36) + '-' +
      Math.floor(Math.random() * 0x100000000).toString(36),
    use: function() {
      _use(emptyArray.slice.call(arguments))
      return instance
    },
    $plugins: []
  }

  function _default(target, source) {
    for (var k in source) if (own.call(source, k) && k.indexOf('$')) {
      if (OBJECT == type.call(source[k]) && OBJECT == type.call(target[k])) _default(target[k], source[k])
      else if (!(k in target)) target[k] = source[k]
    }
  }

  var _use = flatIter(function(plugin) {
    // `~n` is falsy for `n === -1` and truthy otherwise.
    // Works well to turn the  result of `a.indexOf(x)`
    // into a value that reflects the presence of `x` in
    // `a`.
    if (~instance.$plugins.indexOf(plugin)) return

    instance.$plugins.push(plugin)

    if (type.call(plugin) === FUNCTION) plugin = plugin(instance)

    if (!plugin) return

    flatIter(function(filter) {
      filters.push(filter)
    })(plugin.$filter || emptyArray)

    flatIter(function(handler) {
      atHandlers.push(handler)
    })(plugin.$at || emptyArray)

    _default(instance, plugin)
  })

  function makeEmitter(inline, parser) {
    var buf = []
    var emit = {
      x: function (raw){return raw ? buf : buf.join('')},
      a: function (rule, argument, takesBlock) {buf.push(rule, argument && ' ',argument, takesBlock ? ' {\n' : ';\n')},
      A: function () {buf.push('}\n')},
      s: function (selector) {buf.push(selector, ' {\n')},
      S: function () {buf.push('}\n')},
      d: function (prop, value) {buf.push(prop, prop && ':', value, ';\n')}
    }
    for (var i = filters.length; i--;) emit = filters[i](emit, inline, parser)
    return emit
  }

  function localize(match, global, dot, name) {
    if (global) return global
    if (!instance.names[name]) instance.names[name] = name + instance.suffix
    return dot + instance.names[name].match(/^\S+/)
  }

  localize.a = atHandlers

/*/-statements-/*/
  instance.sheet = function(tree) {
    var parser = {
      A: atHandlers,
      a: atRules,
      d: declarations,
      l: localize,
      n: instance.names,
      s: sheet
    }
    var emit = makeEmitter(false, parser)
    sheet(
      parser,
      emit,
      '',    // prefix
      tree,
      1,      // local, by default
      0     // inAtRule
    )

    return emit.x()
  }
/*/-statements-/*/
  instance.inline = function (tree) {
    var parser = {
      d: declarations,
      l: localize,
      n: instance.names
    }
    var emit = makeEmitter(true, parser)
    declarations(
      parser,
      emit,
      '',         // prefix
      tree,
      1           //local
    )
    return emit.x()
  }

  return instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix'.split('|').map(function(m){j2c[m] = _j2c[m]})