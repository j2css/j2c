import {defaults, flatIter, freeze, randChars, type, ARRAY, FUNCTION, NUMBER, OBJECT, STRING} from './helpers'
import {closeSelectors, rules} from './rules'
import {declarations} from './declarations'
import {atRules} from './at-rules'
import {at, global, kv} from './extras'

export default function J2c(options) {
  options = options || {}
  // the buffer that accumulates the output. Initialized in `$sink.init()`
  var buf, err

  // the default sink.
  var _backend = [{
    init: function(){buf=[], err=[]},
    done: function (raw) {
      if (err.length != 0) throw new Error('j2c error(s): ' + JSON.stringify(err,null,2) + 'in context:\n' + buf.join(''))
      return raw ? buf : buf.join('')
    },
    err: function(msg) {
      err.push(msg)
      buf.push('/* +++ ERROR +++ ' + msg + ' */\n')
    },
    raw: function(str) {buf.push(str, _instance.endline)},
    atrule: function (rule, kind, param, takesBlock) {
      buf.push(rule, param && ' ', param, takesBlock ? ' {' : ';', _instance.endline)
    },
    // close atrule
    _atrule: function () {buf.push('}', _instance.endline)},
    rule: function (selector) {buf.push(selector, ' {', _instance.endline)},
    // close rule
    _rule: function () {buf.push('}', _instance.endline)},
    decl: function (prop, value) {buf.push(prop, ':', value, ';', _instance.endline)}
  }]

  // holds the `_filter` and `atrule` handlers
  var _filters = [closeSelectors]
  var _atruleHandlers = []

  // the public API (see the main docs)
  var _instance = {
    at: at,
    global: global,
    kv: kv,
    names: {},
    endline: '\n',
    suffix: randChars(7),
    plugins: [],
    sheet: function(tree) {
      _backend[0].init()
      rules(
        _walkers[0],
        _backend[0],
        '', // prefix
        tree,
        1,  // local, by default
        0   // nesting depth
      )

      return _backend[0].done()
    },
    inline: function (tree, options) {
      _backend[1].init()
      declarations(
        _walkers[1],
        _backend[1],
        '', // prefix
        tree,
        !(options && options.global)   // local, by default
      )
      return _backend[1].done()
    }
  }

  // The `state` (for the core functions) / `walker` (for the plugins) tables.
  var _walkers = [
    // for j2c.sheet
    {
      // helpers for locaizing class and animation names
      localizeReplacer: _localizeReplacer, // second argument to String.prototype.replace
      localize: _localize,                 // mangles local names
      names: _instance.names,              // local => mangled mapping
      atruleHandlers: _atruleHandlers,            // extra at-rules
      // The core walker methods, to be provided to plugins
      atrule: atRules,
      decl: declarations,
      rule: rules
    },
    // likewise, for j2c.inline (idem with `$a`, `a` and `s` removed)
    {
      localizeReplacer: _localizeReplacer,
      localize: _localize,
      names: _instance.names,
      decl: declarations
    }
  ]

  /**
   * Returns a localized version of a given name.
   * Registers the pair in `instnace.name` if needed.
   *
   * @param {string} name - the name to localize
   * @return {string} - the localized version
   */
  function _localize(name) {
    if (!_instance.names[name]) _instance.names[name] = name + _instance.suffix
    return _instance.names[name].match(/^\S+/)
  }

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
  function _localizeReplacer(match, ignore, global, dot, name) {
    return ignore || global || dot + _localize(name)
  }

  // handler options
  if (type.call(options.plugins) === ARRAY) {
    flatIter(function(plugin) {
      _instance.plugins.push(plugin)
      if (type.call(plugin) === FUNCTION) plugin = plugin(_instance)
      if (!plugin) return

      if (type.call(plugin.filter) === FUNCTION) _filters.push(plugin.filter)
      if (type.call(plugin.atrule) === FUNCTION) _atruleHandlers.push(plugin.atrule)
      if (type.call(plugin.sink) === FUNCTION) _backend = plugin.sink()
    })(options.plugins)
  }
  if (type.call(options.names) === OBJECT) _instance.names = options.names
  if (type.call(options.suffix) === STRING) _instance.suffix = options.suffix
  if (type.call(options.suffix) === NUMBER) _instance.suffix = randChars(options.suffix)
  if (type.call(options.endline) === STRING) _instance.endline = options.endine

  _backend[1] = _backend[1] || {
    init: _backend[0].init,
    done: _backend[0].done,
    raw: _backend[0].raw,
    err: _backend[0].err,
    decl: _backend[0].decl
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

  freeze(_instance)
  return _instance
}
