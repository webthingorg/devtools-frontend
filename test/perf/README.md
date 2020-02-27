# To run the test manually.

You can either run this via the Python script, which will start the DevTools frontend in hosted mode automatically.

```
python scripts/test/run_test_suite.py --test-suite=perf
```

Or you can run the test via Node, but you will need to launch the server prior.

1. Run the DevTools frontend server: `npm run server`
1. Build the test (requires TypeScript): `tsc test/perf`
1. Exec the test: `CHROME=/path/to/Chromium node test/perf/boot-perf/boot-perf.js`

If you want to look at the flags for bootperf run it with `--help`.
