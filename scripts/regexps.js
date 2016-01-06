/*eslint-env node*/
/*eslint no-console: 0*/
/*eslint no-undef: 0*/

global.__proto__ = require('compose-regexp')

var maybe = greedy.bind(null, '?')
maybe()
// animation animation-name
// /
//     ()
//     (?:
//         (?:
//             :global\((
//                 [-\w]+
//             )\)
//         )
//     |
//         (?:
//             ()
//             (
//                 [-\w]+
//             )
//         )
//     )
// /

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

// keyframes
// /
//     ( )
//     (?:
//         (?:
//             :global\((
//                 [-\w]+
//             )\)
//         )
//         |
//         (?:
//             ()
//             (
//                 [-\w]+
//             )
//         )
//     )
// /

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

// @global and selector
// /
//     ()
//     (?:
//         (?:
//             :global\((
//                 \.[-\w]+
//             )\)
//         )
//         |
//         (?:
//             (\.)
//             ([-\w]+)
//         )
//     )
// /g

var _global = either(
    sequence(
        ':global(',
        /\s*/,
        '.',
        capture(
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
            capture(/[-\w]+/),
            maybe(
                sequence(
                    /\s*/,
                    capture(':extend('),
                    /\s*/,
                    _global,
                    greedy('*',
                        /\s*/,
                        ',',
                        /\s*/,
                        _global
                    ),
                    /\s*/,
                    ')'
                )
            )
        )
    )
))

console.log('selector / @global\n', selector)
