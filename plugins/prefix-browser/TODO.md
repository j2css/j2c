### Figure a way to reliably prefix pixel-ratio

var mq = window.matchMedia( "(min-width: 500px)" );

The matches property returns true or false depending on the query result, e.g.

if (mq.matches) {
  // window width is at least 500px
} else {
  // window width is less than 500px
}

### PostCSS-based server-side plugin. 