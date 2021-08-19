npm install
cp bundle.js bundle.d.ts
rollup -c
rm -rf node_modules package-lock.json bundle.d.ts
