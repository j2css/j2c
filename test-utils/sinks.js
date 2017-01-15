module.exports.simple = function() {
  var buffer = []
  return [{
    atrule : function(rule, kind, params, hasblock) {
      buffer.push(['atrule', rule, kind, params, hasblock])
    },
    _atrule : function() {
      buffer.push(['_atrule'])
    },
    decl: function(prop, value) {
      buffer.push(['decl', prop, value])
    },
    rule : function(selector) {
      buffer.push(['rule', selector])
    },
    _rule : function() {
      buffer.push(['_rule'])
    },
    err: function(message) {
      buffer.push(['err', message])
    },
    raw: function(str) {
      buffer.push('raw', str)
    },
    buffer: buffer
  }]
}