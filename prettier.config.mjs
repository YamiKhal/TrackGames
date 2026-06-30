/** @type {import("prettier").Config} */
const config = {
	plugins: ["prettier-plugin-tailwindcss"],
	tailwindStylesheet: "./app/globals.css",

	tabWidth: 4,
	useTabs: true,
	printWidth: 180,
	endOfLine: "lf",
	semi: true,
	singleQuote: false,
	arrowParens: "always",
	bracketSpacing: true,
	trailingComma: "all",
};

export default config;
