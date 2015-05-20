new function(){
  function longString(func) {
    var matches = func.toString().match(/function\s*\(\)\s*\{\s*\/\*\!?\s*([\s\S]+?)\s*\*\/\s*\}/);
    if (!matches) return false;
   
    return matches[1];
  }


  window.pages = [
    {
      name: "Inline stlyes: intro",
      code: longString(function(){/*!
  // Here we demonstrate j2c's ability to
  // create inline styles.

  j2c({
    // Underscores are converted to
    // dashes so that property names can
    // be left unquoted.
    background_color:"red",

    // The following sets the width and
    // color of the top and left borders.
    border: {
      top$left: {
        width: "1px",
        color: "white"
      }
    }
  })

  */})
    }, {
      name: "Inline styles: arrays for order",
      code: longString(function(){/*!
  // The order of iteration over the keys
  // of a js object is undefined. If you
  // want to ensure that properties occur
  // in order, use an array:

  j2c([
    {border: "solid 1px grey"},
    {border_left: "dashed 3px green"}
  ])

  */})
    }
  ]

  pages.forEach(function(p){
    p.original = p.code;
  })

  window.initial_js = pages[0].code

}
