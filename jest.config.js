// Two test suites with different environments:
//   unit        -- js/code.js run against a simulated browser DOM (jsdom)
//   integration -- real HTTP requests to the PHP API, which must already be
//                  running and connected to MySQL (see .github/workflows/ci.yml)
module.exports = {
	projects: [
		{
			displayName: "unit",
			testEnvironment: "jsdom",
			testMatch: ["<rootDir>/tests/unit/**/*.test.js"]
		},
		{
			displayName: "integration",
			testEnvironment: "node",
			testMatch: ["<rootDir>/tests/integration/**/*.test.js"]
		}
	]
};
