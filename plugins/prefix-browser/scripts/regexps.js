global.__proto__ = require('compose-regexp')

// These regexes match strings, comments and the targets we really want to match.
// They will thus never match a target inside a string or a comment.
// The end result is verbose, but repeated, identically every time and thus it
// compresses well, ultimately.

var selectorMatcher = JSON.stringify(
    either(
        sequence(
            '"',
            greedy('*',
                /\\[\S\s]|[^"]/
            ),
            '"'
        ),
        sequence(
            "'",
            greedy('*',
                /\\[\S\s]|[^']/
            ),
            "'"
        ),
        sequence(
            '/*',
            /[\S\s]*?/,
            '*/'
        ),
        sequence(capture('SPLIT HERE'), /\b/)
    ).source
)
console.log('selectorMatcher = new RegExp(' + selectorMatcher + ')')