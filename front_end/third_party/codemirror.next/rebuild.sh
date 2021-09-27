npm install
../../../node_modules/.bin/tsc -d -t es2020 -m es2020 --moduleResolution node bundle.ts
../../../node_modules/.bin/rollup -c
rm -rf node_modules package-lock.json bundle.js bundle.d.ts
