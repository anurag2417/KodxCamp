#!/usr/bin/env node
/**
 * Postinstall hook.
 *
 * On Linux, npm sometimes skips installing the linux-x64 variants of
 * esbuild, rollup, and @napi-rs/lzma because the lockfile was generated
 * on macOS or Windows. This script makes sure they are present before
 * the first build.
 *
 * On Windows and macOS this is a no-op.
 *
 * NOTE: this file is `.cjs` (CommonJS) because the root package.json
 * does not set `"type": "module"`. Using `import` here would break at
 * runtime.
 */

const { execSync } = require("node:child_process");
const { platform } = require("node:os");

if (platform() !== "linux") {
  process.exit(0);
}

const PACKAGES = [
  "@esbuild/linux-x64",
  "@rollup/rollup-linux-x64-gnu",
  "@napi-rs/lzma-linux-x64-gnu",
];

console.log("[postinstall] Ensuring Linux x64 binaries are installed...");

for (const pkg of PACKAGES) {
  try {
    require.resolve(pkg + "/package.json");
    console.log("  ok " + pkg);
  } catch {
    console.log("  installing " + pkg);
    try {
      execSync("npm install --no-save --no-audit --no-fund " + pkg, {
        stdio: "inherit",
      });
    } catch (err) {
      console.warn("  warn: could not install " + pkg + ": " + err.message);
    }
  }
}

console.log("[postinstall] Done.");