import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	platform: "neutral",
	target: ["es2022", "node20"],
	dts: true,
	clean: true,
	outDir: "dist",
	sourcemap: true,
	treeshake: true,
});
