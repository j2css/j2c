// If you wanted to turn PockeGrid into a mixin, you could use this:

var border_box = {
    ",:before,:after":{ //note the initial coma
        box_sizing:"border-box"
    }
}

var pocketgrid = module.export = {
    group: [
        /* Clearfix */
        "*zoom: 1",
        border_box,
        {
            ":before,:after": {
                display: "table",
                content: '""',
                line_heigth: 0
            },
            ":after": {clear:"both"},

            /* ul/li compatibility */
            "list-style-type":"none",
            margin$padding:0

        }
    ],
    block: [
        border_box,
        {
            float: "left",
            width: "100%"
        }
    ]
}

// 

pocketgrid.nested = [
    pocketgrid.group,
    {
        clear: "none",
        float: "left",
        margin: "0 !important"
    }
]
/* 

PocketGrid 1.1.0 Copyright (c) 2013 Arnaud Leray
j2c port Copyright (c) 2015 Pierre-Yves Gérardy

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

