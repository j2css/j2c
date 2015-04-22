/* 

PocketGrid 1.1.0 Copyright (c) 2013 Arnaud Leray
j2c port Copyright (c) 2013 Pierre-Yves Gérardy

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var j2c = require("../dist/j2c.commonjs");

j2c.vendors = [];

console.log(j2c.sheet("").add({
  /* Border-box-sizing */
  ".block,.blockgroup":{
    ",:before,:after":{
      box_sizing:"border-box"
    }
  },
  ".blockgroup": [
    /* Clearfix */
    "*zoom: 1",
    {
      ":before,:after": {
        display: "table",
        content: '""',
        line_heigth: 0
      },
      ":after": {clear:"both"},

      /* ul/li compatibility */
      list_style_type:"none",
      margin$padding:0,

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

