module.exports = function(global) {
  global.getComputedStyle = function() {
        //todo
    return // either an object or an array with each element as keys.
  }
  global.document = {
    createElement:function() {
      return {
        style: {
          set textcontent(text){},
          sheet: {cssRules: []}
        }
      }
    },
    documentElement : {
      appendChild: function() {},
      removeChild: function() {}
    }
  }
}