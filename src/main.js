import {defaults, flatIter, freeze, randChars, own, type, ARRAY, FUNCTION, NUMBER, OBJECT, STRING} from './helpers'
import {closeSelectors, rules} from './rules'
import {declarations} from './declarations'

function invoke(fn, tree, state, backend) {
  backend.init()
  try{
    fn(
      state,
      backend,
      '', // prefix
      tree,
      1,  // local, by default
      0   // nesting depth, only for sheet
    )
  } catch(e) {backend.err(e instanceof Error ? e.stack : '' + e)}
  return backend.done()
}

function makeState(prefix, atruleHandlers, suffix) {
  var names = {}
  /**
   * Returns a localized version of a given name.
   * Registers the pair in `instnace.name` if needed.
   *
   * @param {string} name - the name to localize
   * @return {string} - the localized version
   */
  var localize = prefix
    ? function (name) {
      if (!names[name]) names[name] = prefix + name + suffix
      return names[name].match(/^\S+/)
    }
    : function (name) {
      if (!names[name]) names[name] = name + suffix
      return names[name].match(/^\S+/)
    }
  return {
    atruleHandlers: atruleHandlers,
    names: names,
    localize: localize,
    /**
     * Used as second argument for str.replace(localizeRegex, replacer)
     * `ignore`, `global` and `(dot, name)` are mutually exclusive
     *
     * @param {string} match - the whole match (ignored)
     * @param {string|null} ignore - a comment or a string literal
     * @param {string|null} global - a global name
     * @param {string|null} dot - either '.' for a local class name or the empty string otherwise
     * @param {string|null} name - the name to localize
     * @return {string}
     */
    localizeReplacer: function (match, ignore, global, dot, name) {
      return ignore || global || dot + localize(name)
    }
  }
}

export default function J2c(options) {
  options = options || {}
  // the buffer that accumulates the output. Initialized in `$sink.init()`
  var buf, err

  // the default sink.
  var _backend = [{
    init: function () {buf=[], err=[]},
    done: function (raw) {
      if (err.length != 0) throw new Error('j2c error(s): ' + JSON.stringify(err,null,2) + 'in context:\n' + buf.join(''))
      return raw ? buf : buf.join('')
    },
    err: function (msg) {
      err.push(msg)
      buf.push('/* +++ ERROR +++ ' + msg + ' */\n')
    },
    raw: function (str) {buf.push(str, '\n')},
    atrule: function (rule, kind, param, takesBlock) {
      buf.push(rule, param && ' ', param, takesBlock ? ' {\n' : ';\n')
    },
    // close atrule
    _atrule: function () {buf.push('}\n')},
    rule: function (selector) {buf.push(selector, ' {\n')},
    // close rule
    _rule: function () {buf.push('}\n')},
    decl: function (prop, value) {buf.push(prop, ':', value, ';\n')}
  }]

  // holds the `_filter` and `atrule` handlers
  var _filters = [closeSelectors]
  var _atruleHandlers = []
  var _defaults = []
  var _suffix = randChars(7)
  var ns = {}

  // the public API (see the main docs)


  // The `state` (for the core functions)
  var _state

  // handler options
  if (type.call(options.plugins) === ARRAY) {
    flatIter(function(plugin) {
      if (type.call(plugin) !== OBJECT) return

      if (type.call(plugin.filter) === FUNCTION) _filters.push(plugin.filter)
      if (type.call(plugin.atrule) === FUNCTION) _atruleHandlers.push(plugin.atrule)
      if (type.call(plugin.sink) === FUNCTION) _backend = plugin.sink()
      if (type.call(plugin.set) === FUNCTION) _defaults.push(plugin.set)
    })(options.plugins)
  }
  if (type.call(options.suffix) === STRING) _suffix = options.suffix
  if (type.call(options.suffix) === NUMBER) _suffix = randChars(options.suffix)

  _backend[1] = _backend[1] || {
    init: _backend[0].init,
    done: _backend[0].done,
    raw: _backend[0].raw,
    err: _backend[0].err,
    decl: _backend[0].decl
  }

  _state = makeState(0, _atruleHandlers, _suffix)

  var _instance = {
    names: _state.names,
    ns: function(name) {
      var prefix = '__'+name.replace(/\W+/g, '_') + '_'
      if (!own.call(ns, name)){
        var state = makeState(prefix, _atruleHandlers, _suffix)
        ns[name] = defaults({
          prefix: prefix,
          names: state.names,
          sheet: function(tree) {return invoke(rules, tree, state, _backend[0])},
          inline: function (tree) {return invoke(declarations, tree, state, _backend[1])}
        }, _instance)
      }
      return ns[name]

    },
    prefix: '',
    suffix: _suffix,
    sheet: function(tree) {return invoke(rules, tree, _state, _backend[0])},
    inline: function (tree) {return invoke(declarations, tree, _state, _backend[1])}
  }

  // finalize the backend by merging in the filters
  for(var i = 0; i < 2; i++){ // 0 for j2c.sheet, 1 for j2c.inline
    for (var j = _filters.length; j--;) {
      _backend[i] = freeze(
        defaults(
          _filters[j](_backend[i], !!i),
          _backend[i]
        )
      )
    }
  }

  for (i = _defaults.length; i--;) defaults(_instance, _defaults[i]())

  freeze(_instance)
  return _instance
}
