const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const platform = process.platform;
const arch = process.arch;

// Map platform to the native binary packages
const pkgs = [];

if (platform === 'win32' && arch === 'x64') {
  pkgs.push('@rollup/rollup-win32-x64-msvc', '@esbuild/win32-x64');
} else if (platform === 'darwin' && arch === 'arm64') {
  pkgs.push('@rollup/rollup-darwin-arm64', '@esbuild/darwin-arm64');
} else if (platform === 'darwin' && arch === 'x64') {
  pkgs.push('@rollup/rollup-darwin-x64', '@esbuild/darwin-x64');
} else if (platform === 'linux' && arch === 'x64') {
  pkgs.push('@rollup/rollup-linux-x64-gnu', '@esbuild/linux-x64');
} else if (platform === 'linux' && arch === 'arm64') {
  pkgs.push('@rollup/rollup-linux-arm64-gnu', '@esbuild/linux-arm64');
}

if (pkgs.length === 0) {
  console.log('[prebuild] No known binary packages for this platform');
  process.exit(0);
}

function getVersion(pkgName, hintPath) {
  const p = path.join(root, 'node_modules', hintPath, 'package.json');
  if (!existsSync(p)) return null;
  try {
    return execSync(`node -p "require('${p.replace(/\\/g, '/')}').version"`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

function ensure(pkg, version) {
  const installed = path.join(root, 'node_modules', pkg);
  if (existsSync(installed)) {
    console.log(`[prebuild] ✓ ${pkg}@${version}`);
    return;
  }
  console.log(`[prebuild] Installing ${pkg}@${version}...`);
  try {
    execSync(
      `npm install --no-save --force --ignore-scripts --no-audit --no-fund ${pkg}@${version}`,
      { cwd: root, stdio: 'inherit' }
    );
    console.log(`[prebuild] ✅ ${pkg}`);
  } catch (e) {
    console.error(`[prebuild] ❌ Failed ${pkg}:`, e.message);
    process.exit(1); // fail hard so we know
  }
}

const rollupVer = getVersion('rollup', 'rollup');
const esbuildVer = getVersion('esbuild', 'esbuild');

if (pkgs[0] && rollupVer) ensure(pkgs[0], rollupVer);
if (pkgs[1] && esbuildVer) ensure(pkgs[1], esbuildVer);