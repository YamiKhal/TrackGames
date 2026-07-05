import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const PORT = 3000;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: "list",
	globalSetup: "./e2e/global-setup.ts",
	globalTeardown: "./e2e/global-teardown.ts",
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `npx next dev --port ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
