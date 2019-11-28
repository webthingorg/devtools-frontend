# To run the test manually.

1. Run the DevTools frontend server: `npm run server`
2. Run an instance of Chromium with the remote debugging flag, i.e. `./out/Debug/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222`
3. Note the remote debugging WebSocket endpoint.
4. Exec the test: `node test/bootperf/bootperf.js --browserWSEndpoint=ws://127.0.0.1:9222/devtools/browser/ENDPOINT`
