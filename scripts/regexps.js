/*eslint-env node*/
/*eslint no-console: 0*/
/*eslint no-undef: 0*/

global.__proto__ = require('compose-regexp')

var maybe = greedy.bind(null, '?')
maybe()

var animation = sequence(
    capture(),
    either(
        sequence(
            ':global(',
            /\s*/,
            capture(/[-\w]+/),
            /\s*/,
            ')'
        ),
        sequence(
            capture(),
            capture(/[-\w]+/)
        )
    )
)
console.log('anumation / animation-name\n', animation)

var keyframes = sequence(
    capture(' '),
    either(
        sequence(
            ':global(',
            /\s*/,
            capture(/[-\w]+/),
            /\s*/,
            ')'
        ),
        sequence(
            capture(),
            capture(/[-\w]+/)
        )
    )
)

console.log('@keyframes\n', keyframes)

var selector = flags('g', sequence(
    capture(''),
    either(
        sequence(
            ':global(',
            /\s*/,
            capture(
                '.',
                /[-\w]+/
            ),
            /\s*/,
            ')'
        ),
        sequence(
            capture('.'),
            capture(/[-\w]+/)
        )
    )
))

console.log('selector / @global\n', selector)
