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
        "no-constant-binary-expression": "error",
        "no-empty": "off",
        "no-prototype-builtins": "off",
        "no-redeclare": ["error", { "builtinGlobals": false }],
	"no-sequences": ["error"],
        "no-trailing-spaces": ["warn", { "ignoreComments": false }],
        "no-unused-vars": ["warn", { "vars": "local", "args": "none"}],
        "one-var": ["warn", "always"],
	"semi": ["error", "always"]
    },
    "globals": {
        "JXG": "readonly"
    }
};
