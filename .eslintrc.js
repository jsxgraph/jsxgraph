module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2022": true // ecma 13
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 13,
        "sourceType": "module"
    },
    "rules": {
        "no-empty": "off",
        "no-prototype-builtins": "off",

        "comma-dangle": ["error", "never"],
        "eqeqeq": ["error", "smart"],
        "no-constant-binary-expression": "error",
        "no-redeclare": ["error", { "builtinGlobals": false }],
        "no-sequences": ["error"],
        "semi": ["error", "always"],

        "no-trailing-spaces": ["warn", { "ignoreComments": false }],
        "no-unused-vars": ["warn", { "vars": "local", "args": "none"}],
        "one-var": ["warn", "always"],
    },
    "globals": {
        "JXG": "readonly"
    }
};
