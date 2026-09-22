/**
 * Postinstall hook.
 *
 * The lockfile records optional platform-specific binaries for esbuild,
 * rollup, and @napi-rs/lzma. On Linux CI (and on Render), npm sometimes
 * skips installing the linux-x64 variants because the lockfile was
 * generated on macOS or Windows. This script makes sure they are
 * present before the first build.
 *
 * On Windows and macOS this is a no-op — npm resolves the correct
 * optional dependency for the current platform automatically.
 */

import { execSync } from "node:child_process";
import { platform } from "node:os";

if (platform() !== "linux") {
  // Nothing to do — npm already installed the right binaries.
  process.exit(0);
}

const PACKAGES = [
  "@esbuild/linux-x64",
  "@rollup/rollup-linux-x64-gnu",
  "@napi-rs/lzma-linux-x64-gnu",
];

console.log("[postinstall] Ensuring Linux x64 binaries are installed…");

for (const pkg of PACKAGES) {
  try {
    // require.resolve throws if the package isn't present
    require.resolve(`${pkg}/package.json`);
    console.log(`  ✓ ${pkg}`);
  } catch {
    console.log(`  … installing ${pkg}`);
    try {
      execSync(`npm install --no-save --no-audit --no-fund ${pkg}`, {
        stdio: "inherit",
      });
    } catch (err) {
      console.warn(
        `  ⚠ could not install ${pkg}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

console.log("[postinstall] Done.");