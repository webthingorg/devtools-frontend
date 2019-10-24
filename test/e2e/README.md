# To run a test manually.

1. Run the DevTools Front end server: `npm run server`
2. Run an instance of Chromium with the remote debugging flag, i.e. `./out/Debug/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222`
3. Note the remote debugging WebSocket endpoint.
4. Exec the e2e runner against a particular test: `node test/e2e/runner.js --test=./test/e2e/elements/elements-example.js --browserWSEndpoint=ws://127.0.0.1:9222/devtools/browser/bdced091-d90d-4b58-9aa2-8b85222d3f79`
