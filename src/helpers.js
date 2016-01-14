var
  emptyObject = {},
  emptyArray = [],
  type = emptyObject.toString,
  own =  emptyObject.hasOwnProperty,
  OBJECT = type.call(emptyObject),
  ARRAY =  type.call(emptyArray),
  STRING = type.call('')

/*/-inline-/*/
// function cartesian(a, b, res, i, j) {
//   res = [];
//   for (j in b) if (own.call(b, j))
//     for (i in a) if (own.call(a, i))
//       res.push(a[i] + b[j]);
//   return res;
// }
/*/-inline-/*/

/* /-statements-/*/
function cartesian(a,b, selectorP, res, i, j) {
  res = []
  for (j in b) if(own.call(b, j))
    for (i in a) if(own.call(a, i))
      res.push(concat(a[i], b[j], selectorP))
  return res
}

function concat(a, b, selectorP) {
  // `b.replace(/&/g, a)` is never falsy, since the
  // 'a' of cartesian can't be the empty string
  // in selector mode.
  return selectorP && (
    /^[-\w$]+$/.test(b) && ':-error-bad-sub-selector-' + b ||
    /&/.test(b) && /* never falsy */ b.replace(/&/g, a)
  ) || a + b
}
/* /-statements-/*/

export {emptyObject, emptyArray, type, own, OBJECT, ARRAY, STRING, cartesian, concat}