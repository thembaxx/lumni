import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		setupFiles: ["./src/hooks/__tests__/setup.ts"],
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		exclude: ["src/**/*.int-test.ts", "node_modules"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
});
