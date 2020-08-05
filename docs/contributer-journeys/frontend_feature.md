# Adding a Front End Feature

This page will run you through how to add a front end feature using a "Hello World" style tutorial.

The steps to add a front end feature to DevTools are:

1. Selecting a Location
2. Creating Necessary Files
    1. Folder
    2. `FeatureView.ts`
    3. `feature.ts`
    4. `feature-legacy.ts`
    5. `module.json`
    6. `featureView.css`
3. Configuring Experiment Flag
4. Including in Build

## Selecting a Location

DevTools features can be added to many places. The most common options are into the top pane (alongside Sources, Network, Application, etc.) or to the bottom drawer. The top pane is usually reserved for the features with the largest audiences.

If you're unsure, add your feature to the drawer. If you would like to add a feature to the top panel or have questions, please contact the DevTools team (chrome-devtools-staff@).


## Creating Necessary Files

### Folder

Start by creating a new folder for your feature: `devtools-frontend/front_end/feature`.

### FeatureView.ts

**`devtools-frontend/front_end/feature/FeatureView.ts`**
```typescript
export class FeatureViewImpl extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('feature/FeatureView.css'); // Optional
  }
}
```

### feature.ts

**`devtools-frontend/front_end/feature/feature.ts`**
```typescript
import * as FeatureView from './FeatureView.js';

export {FeatureView};
```

### feature-legacy.ts

**`devtools-frontend/front_end/feature/feature-legacy.ts`**
```typescript
import * as FeatureModule from './feature.js';

self.Feature = self.Feature || {};
Feature = Feature || {};

/**
 * @constructor
 */
Feature.FeatureView = FeatureModule.FeatureView.FeatureViewImpl;
```

### module.json

**`devtools-frontend/front_end/feature/module.json`**
```json
{
  "extensions": [
    {
      "type": "view",
      "location": "drawer-view", // Location.
      "id": "feature-view",
      "title": "Feature", // Name that will show in UI
      "order": 100,
      "persistence": "closeable",
      "className": "Feature.FeatureView",
      "experiment": "featureView"
    }
  ],
  "dependencies": [ // Examples only.
    "common",
    "platform",
    "ui",
    "host"
  ],
  "modules": [
    "feature.js",
    "FeatureView.js",
    "feature-legacy.js"
  ],
  "resources": [
    "FeatureView.css" // Optional
  ]
}
```

### FeatureView.css *Optional*

Add custom styling to a css file in your feature folder.

**`devtools-frontend/front_end/feature/FeatureView.css`**
```css
.example {
  width: 100%
  color: green
}
```

## Configuring Experiment Flag

New features must be hidden behind an experiment flag. An experiment flag will allow the Chrome user to toggle the feature by enabling its respective checkbox in `DevTools > Settings > Experiments`.

To configure the experiment flag, navigate to `devtools-frontend/front_end/main/MainImpl.js`.

In the `_intializeExperiments()` function, add the following line:

```javascript
Root.Runtime.experiments.register('featureView', 'Short feature description');
```

> Make sure to maintain the alphabetical sorting!

## Including in Build

To include your feature in the build, you'll want to modify some existing files.

### `devtools-frontend/BUILD.gn`
In the `generated_non_autostart_non_remote_modules` object, add the following line:

  - `"$resources_out_dir/feature/feature_module.js",`

### `devtools-frontend/all_devtools_files.gni`

In the `all_devtools_files` object, add the following lines:

  - `"front_end/feature/module.json",`
  - `"front_end/feature/featureView.css",`

### `devtools-frontend/all_devtools_modules.gni`
In the `all_devtools_module_sources` object, add the following line:

  - `"feature/FeatureView.ts",`

### `devtools-frontend/devtools_grd_files.gni`
In the `grd_files_release_sources` object, add the following lines:
  - `"front_end/feature/feature-legacy.ts",`
  - `"front_end/feature/feature.ts",`
  - `"front_end/feature/feature_module.ts",`

In the `grd_files_debug_sources` object, add the following line:

  - `"front_end/feature/FeatureView.ts",`

### `devtools-frontend/devtools_module_entrypoints.gni`
In the `devtools_module_entrypoint_sources` object, add the following lines:
  - `"feature/feature-legacy.ts",`
  - `"feature/feature.ts",`

### `devtools-frontend/devtools_app.json`

In the `"modules" object, add the following line:

- `{ "name": "feature"},`


