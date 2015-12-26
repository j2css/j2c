import {own, cartesian, emptyArray} from './helpers';
import {sheet} from './sheet';
import {declarations} from './declarations';

var scope_root = "_j2c_" +
      Math.floor(Math.random() * 0x100000000).toString(36) + "_" +
      Math.floor(Math.random() * 0x100000000).toString(36) + "_" +
      Math.floor(Math.random() * 0x100000000).toString(36) + "_" +
      Math.floor(Math.random() * 0x100000000).toString(36) + "_",
    counter = 0;

export default function j2c(res) {
  res = res || {};
  var extensions = [];

  function finalize(buf, i) {
    for (i = 0; i< extensions.length; i++) buf = extensions[i](buf) || buf;
    return buf.join("\n");
  }

  res.use = function() {
    var args = arguments;
    for (var i = 0; i < args.length; i++){
      extensions.push(args[i]);
    }
    return res;
  };
/*/-statements-/*/
  res.sheet = function(ns, statements) {
    if (arguments.length === 1) {
      statements = ns; ns = {};
    }
    var
      suffix = scope_root + counter++,
      locals = {},
      k, buf = [];

      for (k in ns) if (k-0 != k-0 && own.call(ns, k)) {
        locals[k] = ns[k];
      }
    sheet(
      statements, buf, "", emptyArray /*vendors*/,
      function localize(match, space, global, dot, name) {
        if (global) return space+global;
        if (!locals[name]) locals[name] = name + suffix;
        return space + dot + locals[name];
      }
    );
    /*jshint -W053 */
    buf = new String(finalize(buf));
    /*jshint +W053 */
    for (k in locals) if (own.call(locals, k)) buf[k] = locals[k];
    return buf;
  };
/*/-statements-/*/
  res.inline = function (locals, decl, buf) {
    if (arguments.length === 1) {
      decl = locals; locals = {};
    }
    declarations(
      decl,
      buf = [],
      "", // prefix
      emptyArray, // vendors
      function localize(match, space, global, dot, name) {
        if (global) return space+global;
        if (!locals[name]) return name;
        return space + dot + locals[name];
      });
    return finalize(buf);
  };

  res.prefix = function(val, vendors) {
    return cartesian(
      vendors.map(function(p){return "-" + p + "-";}).concat([""]),
      [val]
    );
  };
  return res;
}
j2c(j2c);
delete j2c.use;
