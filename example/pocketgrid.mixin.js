// If you wanted to turn PockeGrid into a mixin, you could use this:

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
