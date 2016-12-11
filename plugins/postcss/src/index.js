var postcss = require('postcss')

var own = {}.hasOwnProperty

function unknownBlock(type){
  throw new Error('j2c-plugin-postcss doesn\'t know how to handle PostCSS nodes of type "' + type + '".')
}

module.exports = function(plugin) {
  return function(){

		// cache the PostCSS processor. Its creation is delayed so that
		// more plugins can be added through $postcss
    var processor

    return {$filter: function(next) {

			// combines successive `j2c-postcss-plugin`-based plugins for efficiency.
      if (own.call(next,'$postcss')) return next.$postcss(plugin)

      var plugins = [plugin]
      var parent, root, done

			// `handlers` and `block` turn the PostCSS tree into
			// j2c streams after processing.
      var handlers = {
        atrule: function (node) {
          if (node.nodes) {
            var params = ''
            if (node.params) {
              params = node.params
            }
            next.a('@'+node.name, params, true)
            block(node.nodes)
            next.A('@'+node.name, params)
          } else {
            next.a('@'+node.name, node.params)
          }
        },
        comment: function(){},
        decl: function (node) {
          if (own.call(node, 'raws') && own.call(node.raws, 'j2c')) next.d('', node.raws.j2c)
          else next.d(node.prop, node.value)
        },
        rule: function (node) {
          next.s(node.selector)
          block(node.nodes)
          next.S(node.selector)
        }
      }

      function block(nodes) {
        nodes.forEach(function (node) {
          (handlers[node.type]||unknownBlock(node.type))(node)
        })
      }

			// These filters turn the streams into a PostCSS tree.
			// Once done, `this.x()` turns back the tree into a
			// series of streams.
      return {
        $postcss: function(plugin) {
          plugins = [plugin].concat(plugins)
          return this
        },
        init: function(){
          parent = postcss.root()
          root = parent
          done = false
          next.i()
        },
        done: function() {
          if (!done) {
            done = true
						// initialize the processor if needed
            processor = processor || postcss(plugins)
            if (root !== parent) throw new Error("Missing '}'")
            var options = {stringifier: function () {}}
            var result = root.toResult(options)

						// process and convert back to j2c streams
            block(processor.process(result, options).root.nodes)
          }
          return next.x.apply(next, arguments)
        },
        atrule: function(rule, params, takesBlock) {
          var node = {name: rule.slice(1)}
          if (params !== '') node.params = params
          node = postcss.atRule(node)
          parent.push(node)
          if (takesBlock) {
            node.nodes = []
            parent = node
          }
        },
        _atrule: function () {
          parent = parent.parent
        },
        decl: function (prop, value) {
          if (prop !== '') parent.push(postcss.decl({prop: prop, value: value}))
					// Use a custom property to pass raw declarations through the plugins unaltered
          else parent.push(postcss.decl({prop: 'j2c-raw', value: 'j2c-raw', raws:{j2c: value}}))
        },
        rule: function (selector) {
          var rule = postcss.rule({selector: selector})
          parent.push(rule)
          parent = rule
        },
        _rule: function () {
          parent = parent.parent
        }
      }
    }}
  }
}
