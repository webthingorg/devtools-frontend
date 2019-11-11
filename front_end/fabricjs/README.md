# Why does Devtools Project need Fabric JS?

The WebAudio panel (front_end/webaudio) has an interactive audio graph
visualization (Project Geiger) and it requires a fast 2D raster graphics
library.

  - Project GitHub: https://github.com/fabricjs/fabric.js

# Maintaining/Updating Fabric JS in Devtools Project

We use a custom build of Fabric JS. To create a custom build, one should start
by cloning the repository:

```bash
git clone git@github.com:fabricjs/fabric.js.git
cd fabric
npm install
npm install uglify-js -g
```

Then build a customized library with the following command line:
```bash
node build.js modules=ALL exclude=gestures,accessors,parser,node,image_filters,easing,freedrawing,object_straightening,serialization no-svg-export requirejs minifier=uglifyjs
```

This will produce a unminified library file (657KB) under `dist/` directory.
Add the following lines at the top of the code:

```js
// clang-format off
/* eslint-disable */
```

Also 1) remove the last empty line and 2) remove all trailing spaces.

Then copy the file into:
```
cp dist/fabric.js PATH_TO_DEVTOOLS_SOURCE/devtools-frontend/front_end/fabricjs/fabric.js
```
