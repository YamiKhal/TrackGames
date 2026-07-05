import nextJest from "next/jest.js";
import type { Config } from "jest";

const createJestConfig = nextJest({
	dir: "./",
});

const config: Config = {
	coverageProvider: "v8",
	testEnvironment: "jsdom",
	clearMocks: true,
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	testMatch: ["**/__tests__/**/*.+(js|jsx|ts|tsx)"],
	collectCoverageFrom: ["src/components/ui/**/*.{ts,tsx}", "src/components/game/StarRating.tsx"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
};

export default createJestConfig(config);
