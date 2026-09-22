#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const platform = process.platform;
const arch = process.arch;

let rollupPkg = null;
let esbuildPkg = null;

if (platform === 'win32' && arch === 'x64') {
  rollupPkg = '@rollup/rollup-win32-x64-msvc';
  esbuildPkg = '@esbuild/win32-x64';
} else if (platform === 'linux' && arch === 'x64') {
  rollupPkg = '@rollup/rollup-linux-x64-gnu';
  esbuildPkg = '@esbuild/linux-x64';
} else if (platform === 'darwin' && arch === 'arm64') {
  rollupPkg = '@rollup/rollup-darwin-arm64';
  esbuildPkg = '@esbuild/darwin-arm64';
} else if (platform === 'darwin' && arch === 'x64') {
  rollupPkg = '@rollup/rollup-darwin-x64';
  esbuildPkg = '@esbuild/darwin-x64';
} else if (platform === 'linux' && arch === 'arm64') {
  rollupPkg = '@rollup/rollup-linux-arm64-gnu';
  esbuildPkg = '@esbuild/linux-arm64';
}

if (!rollupPkg) {
  console.log('[native-deps] platform not mapped, skipping');
  process.exit(0);
}

function getVersion(pkgPath) {
  if (!existsSync(pkgPath)) return null;
  try {
    return execSync(`node -p "require('${pkgPath.replace(/\\/g, '/')}').version"`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

function install(pkg, version) {
  if (!pkg || !version) return;
  const target = path.join(root, 'node_modules', pkg);
  if (existsSync(target)) {
    console.log(`[native-deps] ✓ ${pkg}@${version}`);
    return;
  }
  console.log(`[native-deps] Installing ${pkg}@${version}...`);
  try {
    execSync(`npm install --no-save --force --ignore-scripts ${pkg}@${version}`, {
      cwd: root,
      stdio: 'inherit',
    });
    console.log(`[native-deps] ✅ ${pkg}`);
  } catch (e) {
    console.error(`[native-deps] ❌ ${pkg}:`, e.message);
  }
}

const rollupVer = getVersion(path.join(root, 'node_modules', 'rollup', 'package.json'));
const esbuildVer = getVersion(path.join(root, 'node_modules', 'esbuild', 'package.json'));

install(rollupPkg, rollupVer);
install(esbuildPkg, esbuildVer);