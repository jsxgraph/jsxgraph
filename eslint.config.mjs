import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.commonjs,
            JXG: "readonly",
        },

        ecmaVersion: 13,
        sourceType: "module",
    },

    rules: {
        "comma-dangle": ["error", "never"],
        "eqeqeq": ["error", "smart"],
        "no-constant-binary-expression": "error",
        "no-empty": "off",
        "no-prototype-builtins": "off",

        "no-redeclare": ["error", {
            builtinGlobals: false,
        }],

        "no-sequences": ["error"],

        "no-trailing-spaces": ["warn", {
            ignoreComments: false,
        }],

        "no-unused-vars": ["warn", {
            "vars": "local",
            "args": "none",
            "caughtErrors": "none"
        }],

        "one-var": ["warn", "always"],
        "semi": ["error", "always"],
    },
}];