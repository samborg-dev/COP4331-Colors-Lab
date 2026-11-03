const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	{
		ignores: ["node_modules/"]
	},
	js.configs.recommended,
	{
		files: ["js/**/*.js"],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "script",
			globals: {
				...globals.browser,
				// Defined in js/md5.js, which is loaded before js/code.js
				md5: "readonly"
			}
		},
		rules: {
			// Handlers in code.js are called from onclick/onload attributes in the HTML
			"no-unused-vars": ["error", { varsIgnorePattern: "^(doLogin|readCookie|doLogout|addColor|searchColor|md5)$" }],
			"no-redeclare": ["error", { builtinGlobals: false }],
			"eqeqeq": "error",
			"no-var": "warn",
			"semi": "error"
		}
	},
	{
		// Vendored MD5 implementation; keep it as close to upstream style as possible
		files: ["js/md5.js"],
		rules: {
			"no-var": "off"
		}
	},
	{
		files: ["eslint.config.js"],
		languageOptions: {
			sourceType: "commonjs",
			globals: globals.node
		}
	}
];
