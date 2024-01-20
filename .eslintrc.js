module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 13,
        "sourceType": "module"
    },
    "rules": {
        "comma-dangle": ["error", "never"],
        "eqeqeq": ["error", "smart"],
        "no-trailing-spaces": ["warn", { "ignoreComments": false }],
        "no-unused-vars": ["warn", { "vars": "local", "args": "none"}],
        "no-redeclare": ["error", { "builtinGlobals": false }],
        "no-prototype-builtins": "off",
        "no-empty": "off",
        "no-constant-binary-expression": "error",
        "one-var": ["warn", "always"],
	"semi": ["error", "always"]
    },
    "globals": {
        "JXG": "readonly"
    }
};
