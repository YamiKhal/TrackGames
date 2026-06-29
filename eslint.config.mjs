import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import yamikhal from "./eslint-plugin/index.js";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	eslintConfigPrettier,

	globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**"]),

	{
		files: ["**/*.{ts,tsx}"],

		plugins: {
			yamikhal,
			import: importPlugin,
		},

		rules: {
			"import/first": "error",
			"import/newline-after-import": "warn",
			"import/no-duplicates": "error",
			"import/no-self-import": "error",
			"import/no-useless-path-segments": "warn",

			"no-console": "warn",
			"no-else-return": "warn",
			"no-lonely-if": "warn",
			"no-multi-spaces": "warn",
			"no-trailing-spaces": ["warn", { ignoreComments: false }],
			"no-undef": "off",
			"no-unneeded-ternary": "warn",
			"no-unused-vars": "off",
			"no-useless-catch": "warn",
			"no-useless-computed-key": "warn",
			"no-useless-return": "warn",
			"no-var": "error",
			"object-shorthand": ["warn", "always", { avoidQuotes: true }],
			"prefer-const": "warn",

			"yamikhal/file-structure": "warn",
			"yamikhal/section-spacing": "warn",
		},
	},
	{
		files: ["**/*,ts"],
		rules: {
			"max-lines-per-function": [
				"warn",
				{
					max: 120,
					skipBlankLines: true,
					skipComments: true,
				},
			],
		},
	},
	{
		files: ["**/*,tsx"],
		rules: {
			"max-lines-per-function": [
				"warn",
				{
					max: 250,
					skipBlankLines: true,
					skipComments: true,
				},
			],
		},
	},
]);

export default eslintConfig;
