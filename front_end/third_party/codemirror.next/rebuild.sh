npm install
cp bundle.js bundle.d.ts
../../../node_modules/.bin/rollup -c
rm -rf node_modules package-lock.json bundle.d.ts
