# Adding a Front End Feature

This page will run you through how to add a front end feature using a "Hello World" style tutorial.

The steps to add a front end feature to DevTools are:

1. Selecting a Location
2. Creating Necessary Files
    1. Add a new folder for the feature
    2. `FeaturePanel.ts`
    3. `feature.js`
    4. `feature-legacy.js`
    5. `module.json`
    6. `featurePanel.css`
3. Configuring Experiment Flag
4. Including in Build

## Selecting a Location

New webplatform features can be surfaced in many different areas of DevTools. The most common option is to integrate it in one of the top panes like Sources, Network, Application. For stand-alone features adding a new tab to the bottom drawer is usually the way to go.

If you're unsure about how or where to integrate your feature, please reach out to the DevTools team (chrome-devtools-staff@) for guidance.

When adding your feature to an already existing part of the code, it's best to adhere to the coding style in that area.

The following steps will show you how to add a new module that shows up as a tab in the bottom drawer according to the current best practices.

## Creating Necessary Files

### Add a new folder

The DevTools codebase is splitted into multiple modules. Each module has it's own folder in the `front_end` directory. Start adding your new module by creating a new folder for your feature: `devtools-frontend/front_end/feature`. Make sure to only use lowercase letters and underscores.

### FeaturePanel.ts

Every tab in the bottom drawer needs a primary view to show the content.
The DevTools codebase already has many predefined utilities that help you work faster and keep the user interface consistent and accessible. Most of them can be found in the `ui` module. Modules are always included by importing like this:
```typescript
import * as Module from '../module/module.js';
```
Please refrain from including submodules directly because that might break assumptions in the build system.

The primary view in a bottom drawer tab is called a panel and usually extends `UI.Widget.VBox`:

**`devtools-frontend/front_end/feature/FeaturePanel.ts`**
```typescript

import * as UI from '../ui/ui.js';

export class FeaturePanelImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    // Optional: add a css file that will be scoped to this component
    this.registerRequiredCSS('feature/featurePanel.css');

    // this.contentElement servces as the root node for this component
    const message = document.createElement('span');
    message.innerText = 'Hello World';
    message.classList.add('message');
    this.contentElement.appendChild(message);
  }
}
```

### feature.js

To make your module accessible to the outside world, a file with the same name as the module is required. In there, you can export everything that should be public. You have to include the primary view here to make sure that DevTools can find it when your tab is opened.

**`devtools-frontend/front_end/feature/feature.js`**
```typescript
import * as FeaturePanel from './FeaturePanel.js';

export {FeaturePanel};
```

### feature-legacy.js

The `feature-legacy.js` file is necessary to bridge the gap between TypeScript and JavaScript for now.

**`devtools-frontend/front_end/feature/feature-legacy.js`**
```typescript
import * as FeatureModule from './feature.js';

self.Feature = self.Feature || {};
Feature = Feature || {};

/**
 * @constructor
 */
Feature.FeaturePanel = FeatureModule.FeaturePanel.FeaturePanelImpl;
```

### module.json

The `module.json` files are used by DevTools to store information about modules that will be used when the module is to be loaded.

__`extensions`__: This field allows you to define how DevTools uses your module. In this example, we want to provide a new tab in the bottom drawer.

__`dependencies`__: This field allows you to list all modules this module depends on. DevTools will make sure they are loaded before this module will be loaded. __Circular dependencies are not supported.__

__`modules`__: This field lists all the JavaScript/TypeScript files that belong to the module.

__`resources`__: This field lists all resources like images or css files used by this module.

> Make sure to remove the comments from the following example because the file would otherwise not be valid json.

**`devtools-frontend/front_end/feature/module.json`**
```json
{
  "extensions": [
    {
      "type": "view",
      "location": "drawer-view", // Location.
      "id": "feature-view", // This has to be a unique id
      "title": "Feature", // Name that will show in UI
      "order": 100,
      "persistence": "closeable",
      // className has to match the name of a symbol exported in feature.js
      "className": "Feature.FeaturePanel",
      // Tabs can be hidden behind experiments for unstable components. More on that later.
      "experiment": "featurePanel"
    }
  ],
  "dependencies": [
    "ui" // In this example, we only used ui so far
  ],
  "modules": [
    "feature.js",
    "FeaturePanel.js",
    "feature-legacy.js"
  ],
  "resources": [
    "featurePanel.css"
  ]
}
```

### featurePanel.css *Optional*

Add custom styling to a css file in your feature folder.

> The convention around css files is to have them start with a lowercase letter

**`devtools-frontend/front_end/feature/featurePanel.css`**
```css
.message {
  width: 100%;
  color: green;
}
```

## Configuring Experiment Flag

New features must be hidden behind an experiment flag as long as they are not stable yet. An experiment flag will allow the Chromium user to toggle the feature by enabling its respective checkbox in `DevTools > Settings > Experiments`.

To configure the experiment flag, navigate to `devtools-frontend/front_end/main/MainImpl.js`.

In the `_intializeExperiments()` function, add the following line:

```javascript
// The id 'featurePanel' has to match the one in the module.json file
Root.Runtime.experiments.register('featurePanel', 'Short feature description');
```

> Make sure to maintain the alphabetical sorting!

## Including in Build

DevTools uses `autoninja` to build for various targets. In order for your module to be accessible to `gn`, you have to add the following file:

**`devtools-frontend/front_end/feature/BUILD.gn`**
```gn

import("../../scripts/build/ninja/devtools_entrypoint.gni")
import("../../scripts/build/ninja/devtools_module.gni")

devtools_module("feature") {
  sources = [
    "FeaturePanel.ts"
  ]

  deps = [
    "../ui:bundle",
  ]
}

devtools_entrypoint("bundle") {
  entrypoint = "feature.js"
  deps = [ ":feature" ]
}

```


To include your feature in the build, you'll want to modify some existing files too:

### `devtools-frontend/BUILD.gn`
In the `generated_non_autostart_non_remote_modules` object, add the following line:

```
  "$resources_out_dir/feature/feature_module.js",
```

### `devtools-frontend/all_devtools_files.gni`

In the `all_devtools_files` object, add the following lines:

```
  "front_end/feature/module.json",
  "front_end/feature/featurePanel.css",
```

### `devtools-frontend/all_devtools_modules.gni`
In the `all_typescript_module_sources` object, add the following line:

```
  "feature/FeaturePanel.js",
```

### `devtools-frontend/devtools_grd_files.gni`
In the `grd_files_release_sources` object, add the following lines:
```
  "front_end/feature/feature.js",
  "front_end/feature/feature_module.js",
```

In the `grd_files_debug_sources` object, add the following line:
```
  "front_end/feature/FeaturePanel.js",
```

### `devtools-frontend/devtools_module_entrypoints.gni`
In the `generated_typescript_entrypoint_sources` object, add the following lines:
```
  "$resources_out_dir/feature/feature.js",
```

### `devtools-frontend/front_end/BUILD.gn`
In the `group("front_end")` function, add the following line:
```
  "feature:bundle",
```

### `devtools-frontend/devtools_app.json`

In the `"modules"` object, add the following line:

```json
  { "name": "feature"}
```

