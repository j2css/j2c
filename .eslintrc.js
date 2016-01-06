module.exports = {
    rules: {
        indent: [
            2, 2
        ],
        quotes: [
            2,
            "single",
            "avoid-escape"
        ],
        "linebreak-style": [
            2,
            "unix"
        ],
        semi: [
            2,
            "always"
        ],
        "no-trailing-spaces": [2]
    },
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module"
    },
    ecmaFeatures: {
        modules: true
    },
    sourceType: "module",
    env: {
        es6: true,
        node: true,
        browser: true
    },
    extends: "eslint:recommended"
};