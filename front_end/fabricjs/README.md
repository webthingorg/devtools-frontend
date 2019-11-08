# Why does Devtools Project need Fabric JS?

The WebAudio panel (front_end/webaudio) has an interactive audio graph
visualization (Project Geiger) and it requires a fast 2D raster graphics
library.

  - Project GitHub: https://github.com/fabricjs/fabric.js

# Maintaining/Updating Fabric JS in Devtools Project

We use a custom build of Fabric JS. To create a custom build, one should start
by cloning the repository:

## Step 1: Cloning the project repo

```bash
git clone git@github.com:fabricjs/fabric.js.git
cd fabric
npm install
npm install uglify-js -g
```

## Step 2: Perform a custom build

Then build a customized library with the following command line:

```bash
node build.js requirejs modules=ALL exclude=gestures,accessors,parser,node,image_filters,easing,freedrawing,object_straightening,serialization no-svg-export
npm run lint && npm run lint_tests
```

This will produce a unminified library file (657KB) under `dist/` directory.

## Step 3: Clean up the produced file

1. Add the following lines at the top of the produced file:

```js
// clang-format off
/* eslint-disable */
```

2. Remove all trailing spaces.

3. Remove the last empty line.

4. Overwrite the old version in the devtools directory with the newly produced
  version.

```bash
cp dist/fabric.js PATH_TO_DEVTOOLS_SOURCE/devtools-frontend/front_end/fabricjs/fabric.js
```
