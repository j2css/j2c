/*! PocketGrid 1.1.0
* Copyright 2013 Arnaud Leray
* MIT License
*/
var j2c = require("../dist/j2c.commonjs");

j2c.vendors = [];

// here's a straight port.

console.log(j2c.sheet("").add({
  /* Border-box-sizing */
  ".block,.blockgroup":{
    ",:before,:after":{
      "box-sizing":"border-box"
    }
  },
  ".blockgroup": [
    /* Clearfix */
    "*zoom: 1",
    {
      ":before,:after": {
        display: "table",
        content: '""',
        "line-heigth": 0
      },
      ":after": {clear:"both"},

      /* ul/li compatibility */
      "list-style-type":"none",
      padding:0,
      margin:0,

      " > .blockgroup": {
        /* Nested grid */
        clear: "none",
        float: "left",
        margin: "0 !important"
      }
    }
  ],
  /* Default block */
  ".block": {
    float: "left",
    width: "100%"
  }
}).toString())


// If you wanted to turn it into a mixin, you could use this:

var pocketgrid = {
  blockgroup: [
    ",:before,:after":{ //note the initial coma
      "box-sizing":"border-box"
    },
    /* Clearfix */
    "*zoom: 1",
    {
      ":before,:after": {
        display: "table",
        content: '""',
        "line-heigth": 0
      },
      ":after": {clear:"both"},

      /* ul/li compatibility */
      "list-style-type":"none",
      padding:0,
      margin:0,

      " > .blockgroup": {
        /* Nested grid */
        clear: "none",
        float: "left",
        margin: "0 !important"
      }
    }
  ],
  block: {
    ",:before,:after":{ //note the initial coma
      "box-sizing":"border-box"
    },
    float: "left",
    width: "100%"
  }
}
