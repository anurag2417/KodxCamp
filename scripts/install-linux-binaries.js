const { execSync } = require('node:child_process');
const { existsSync, mkdirSync, rmSync, cpSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');

function downloadAndExtract(pkgName, version) {
  const encoded = pkgName.replace('/', '%2f');
  const url = `https://registry.npmjs.org/${pkgName}/-/${pkgName.split('/').pop()}-${version}.tgz`;
  const tmp = path.join(os.tmpdir(), `${pkgName.replace('/', '-')}-${version}.tgz`);
  const extractDir = path.join(os.tmpdir(), `${pkgName.replace('/', '-')}-extract`);
  const target = path.join(root, 'node_modules', pkgName);

  if (existsSync(target) && existsSync(path.join(target, 'package.json'))) {
    console.log(`[linux-deps] ✓ ${pkgName}@${version} already present`);
    return;
  }

  console.log(`[linux-deps] Downloading ${pkgName}@${version}...`);
  try {
    rmSync(extractDir, { recursive: true, force: true });
    mkdirSync(extractDir, { recursive: true });

    execSync(`curl -fsSL "${url}" -o "${tmp}"`, { stdio: 'inherit' });
    execSync(`tar -xzf "${tmp}" -C "${extractDir}"`, { stdio: 'inherit' });

    mkdirSync(target, { recursive: true });
    cpSync(path.join(extractDir, 'package'), target, { recursive: true });

    console.log(`[linux-deps] ✅ ${pkgName}@${version}`);
  } catch (e) {
    console.error(`[linux-deps] ❌ Failed ${pkgName}@${version}:`, e.message);
    process.exit(1);
  }
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  console.log('[linux-deps] Not Linux x64, skipping');
  process.exit(0);
}

// Rollup version — read from installed rollup package
const rollupPkgPath = path.join(root, 'node_modules', 'rollup', 'package.json');
let rollupVersion = null;
if (existsSync(rollupPkgPath)) {
  rollupVersion = require(rollupPkgPath).version;
}

if (rollupVersion) {
  downloadAndExtract('@rollup/rollup-linux-x64-gnu', rollupVersion);
} else {
  console.warn('[linux-deps] rollup not found, cannot determine version');
}

// esbuild version used by Vite — read from vite's nested esbuild if present,
// otherwise the top-level esbuild
const esbuildPaths = [
  path.join(root, 'node_modules', 'vite', 'node_modules', 'esbuild', 'package.json'),
  path.join(root, 'node_modules', 'esbuild', 'package.json'),
];
let esbuildVersion = null;
for (const p of esbuildPaths) {
  if (existsSync(p)) {
    esbuildVersion = require(p).version;
    break;
  }
}

if (esbuildVersion) {
  downloadAndExtract('@esbuild/linux-x64', esbuildVersion);
} else {
  console.warn('[linux-deps] esbuild not found, cannot determine version');
}