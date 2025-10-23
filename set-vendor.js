const fs = require('fs');
const path = require('path');

// Only run if vendor doesn't exist or is empty
const vendorPath = path.join(__dirname, 'vendor', 'koa');

if (!fs.existsSync(vendorPath)) {
  console.log('Setting up vendor directory with patched Koa...');

  // Remove vendor if it exists
  const vendorDir = path.join(__dirname, 'vendor');
  if (fs.existsSync(vendorDir)) {
    fs.rmSync(vendorDir, { recursive: true, force: true });
  }

  // Copy node_modules/koa to vendor/
  const koaSource = path.join(__dirname, 'node_modules', 'koa');
  if (!fs.existsSync(koaSource)) {
    console.error('Error: koa not found in node_modules. Run npm install first.');
    process.exit(1);
  }

  fs.mkdirSync(vendorPath, { recursive: true });
  copyRecursive(koaSource, vendorPath);

  // Update vendor/koa/package.json - remove scripts and dependencies
  const pkgPath = path.join(vendorPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts;
  delete pkg.dependencies;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Copy patches over
  const patchDir = path.join(__dirname, 'patch', 'koa');
  if (fs.existsSync(patchDir)) {
    copyRecursive(patchDir, vendorPath);
    console.log('Applied patches to vendor/koa');
  }

  // Update package.json to use the patched version
  const rootPkgPath = path.join(__dirname, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  if (!rootPkg.dependencies['koa-patch']) {
    rootPkg.dependencies['koa-patch'] = 'file:./vendor/koa';
    fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));
    console.log('Updated package.json to use patched koa');
  }

  console.log('Vendor setup complete!');
} else {
  console.log('Vendor directory already exists, skipping setup.');
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
