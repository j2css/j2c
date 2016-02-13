import {own, flatIter, emptyArray, type, FUNCTION, OBJECT} from './helpers'
import {sheet} from './sheet'
import {declarations} from './declarations'

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
    var _at = at.bind.apply(at, [null].concat([].slice.call(arguments,0)))
    _at.toString = function(){return '@' + rule + ' ' + params}
    return _at
  }
  else return kv('@' + rule +' ' + params, block)
}

export default function j2c() {
  var filters = []
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
    })(plugin.$filter||[])

    _default(instance, plugin)
  })

  function makeEmitter(inline) {
    var buf = []
    function push() {
      emptyArray.push.apply(buf, arguments)
    }
    var emit = {
      x: function(raw){return raw ? buf : buf.join('')},   // buf
      a: push, // at-rules
      s: push, // selector
      d: push, // declaration
      c: push  // close
    }
    for (var i = filters.length; i--;) emit = filters[i](emit, inline)
    return emit
  }

  // } else if (/^.composes$/.test(k)) {
  //   if (!local) {

  //     return emit.a('@-error-at-composes-in-at-global', '', '', ';\n')

  //   }
  //   if (!composes) {

  //     return emit.a('@-error-at-composes-no-nesting', '', '', ';\n')

  //   }

  //   params = (type.call(v) == ARRAY ? v.join(' ') : v).replace(/\./g, '')

  //   // TODO: move this to the validation plugin.
  //   // if(!/^\s*\w[-\w]*(?:\s+\w[-\w]*)*\s*$/.test(params)) {
  //   //   return emit.a(
  //   //     '@-error-at-composes-invalid-character', ' ',
  //   //     JSON.stringify(params.match(/\b-|[^-\w\s]/)[0]) + ' in ' + JSON.stringify(v), ';\n')
  //   // }

  //   composes = splitSelector(composes)
  //   for(i = 0; i < composes.length; i++) {
  //     k = /^\s*\.(\w+)\s*$/.exec(composes[i])
  //     if (k == null) {
  //       // the last class is a :global(.one)

  //       emit.a('@-error-at-composes-bad-target', ' ', JSON.stringify(composes[i]), ';\n')

  //       continue
  //     }

  //     state.c(params, k[1]) //compose

  //   }
    // c: function composes(parent, child) {
    //   instance.names[child] = instance.names[child] + ' ' + parent
    // },

  instance.compose = function(target, source) {
    if(!/^-?[_A-Za-z][-\w]*$/.test(target))
      throw new Error('Bad target class ' + JSON.stringify(target))

    flatIter(function(source) {
      if(!/^\s*-?[_A-Za-z][-\w]*(?:\s+-?[_A-Za-z][-\w]*)*\s*$/.test(source))
        throw new Error('Bad source class ' + JSON.stringify(source.match(/(?:^| )--|[^-\w\s]|^$/)[0]))
    })(source)

    localize(0,0,0,target)

    flatIter(function(source) {
      instance.names[target] = instance.names[target] + ' ' + source
    })(source)
  }

  function localize(match, global, dot, name) {
    if (global) return global
    if (!instance.names[name]) instance.names[name] = name + instance.suffix
    return dot + instance.names[name].match(/^\S+/)
  }

/*/-statements-/*/
  instance.sheet = function(statements, emit) {
    sheet(
      statements,
      emit = makeEmitter(false),
      '', '',     // prefix and compose
      1,          // local, by default
      localize
    )

    return emit.x()
  }
/*/-statements-/*/
  instance.inline = function (_declarations, emit) {
    declarations(
      _declarations,
      emit = makeEmitter(true),
      '',         // prefix
      1,          //local
      localize
    )
    return emit.x()
  }

  return instance
}

var _j2c = j2c()
'sheet|inline|names|at|global|kv|suffix|compose'.split('|').map(function(m){j2c[m] = _j2c[m]})