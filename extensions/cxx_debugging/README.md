# Chrome DevTools C/C++ Debugging Extension

This extension enables debugging capabilities for C++ programs compiled to WebAssembly for DevTools.

## Building

Currently only linux builds are supported.

Note that some of the extension's dependencies are not checked out by default together with devtools-frontend. To enable
that set the `checkout_cxx_debugging_extension_deps` flag to `True` in your `.gclient` config, for example like this:

`.gclient`:
```python
solutions = [
  {
    "name"        : "devtools-frontend",
    "url"         : "https://chromium.googlesource.com/devtools/devtools-frontend",
    "deps_file"   : "DEPS",
    "managed"     : True,
    "custom_deps" : {
    },
    "custom_vars": {
      "checkout_cxx_debugging_extension_deps": True
    },
  }
]
```

Don't forget to update the dependencies by running
```bash
gclient sync
```

The extension uses a two-stage build that you can then run using
```bash
./tools/bootstrap.py -debug ../../out
```

from within this directory. This produces two output directories inside the `out` folder:

- `DevTools_CXX_Debugging.stage1` which contains some native binaries required for the second build stage
- `DevTools_CXX_Debugging.stage2` containing the built extension

The bootstrap tool tries to autodetect `gomacc` to speed up the build. If `gomacc` is not detected, it can be specified
 by `-goma`. Run `./tools/bootstrap.py -help` to get an overview of all available build options.

## Running

You can for example load the extension in chrome directly from the command line from the devtools repository root

```bash
third_party/chrome/chrome-linux/chrome --load-extension=$PWD/out/DevTools_CXX_Debugging.stage2/src
```

## Front-end testing

The extension contains TypeScript and general front-end components, which are tested via `karma` based tests. These
tests are located in the `tests/` folder, following the `foo_test.ts` naming convention from the DevTools front-end.
These tests are also automatically run by default by `tools/bootstrap.py` unless you explicitly pass the `-no-check`
argument there. They can also be executed explicitely by running `ninja check-extension` in the stage2 output directory.
