#!/bin/bash
set -e

# Only run if vendor doesn't exist or is empty
if test ! -d "vendor/koa"; then
  rm -rf vendor
  
  cp -r node_modules/koa vendor/
  
  node -e "
  const p = './vendor/koa/package.json';
  const pkg = require(p);
  delete pkg.scripts;
  delete pkg.dependencies;
  require('fs').writeFileSync(p, JSON.stringify(pkg, null, 2));
  "
  
  cp -r patch/koa/* vendor/koa/
  
  node -e "
  const p = './package.json';
  const pkg = require(p);
  if (!pkg.dependencies['koa-patch']) {
    pkg.dependencies['koa-patch'] = 'file:./vendor/koa';
    require('fs').writeFileSync(p, JSON.stringify(pkg, null, 2));
  }
  "
fi