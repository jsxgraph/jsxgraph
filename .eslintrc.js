module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 13
    },
    "rules": {
        "eqeqeq": ["error", "smart"],
        "no-trailing-spaces": ["warn", { "ignoreComments": true }],
        "one-var": ["warn", "always"],
        "no-unused-vars": ["warn"],
        "no-redeclare": ["error", { "builtinGlobals": false }],
        "no-prototype-builtins": "off",
        "no-empty": ["warn"]
    },
    "globals": {
        "JXG": "readonly"
    }
};
