<<<<<<< HEAD
# Extensions

Extensions are classified under types of which the main are 'Action', 'View', 'Setting' and type lookups. Each type of extension serves a different purpose and has its unique API to register an extension. Below is an overview of these API's by extension type along with important considerations to be taking when registering extensions.


## Views

The registration of a view describes a pane’s properties, including the class that wraps the element representing the view. A view registration is represented by the `ViewRegistration` interface, declared in [ui/ViewRegistration.ts](./ViewRegistration.ts).

All extensions of type ‘view’ are registered using the function `UI.ViewManager.registerViewExtension` which expects an object of type `ViewRegistration` as parameter.

As an example, take the registration of the `Network conditions` pane, which is located in the drawer:
```js
UI.ViewManager.registerViewExtension({
	location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
	id:  'network.config',
	commandPrompt:  'Show Network conditions',
	title: ls`Network conditions`,
	persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
	order:  40,
	tags:  [
		ls`disk cache`,
		ls`network throttling`,
		ls`useragent`,
		ls`user agent`,
		ls`user-agent`
	],
	async loadView()  {
		const  Network  = await loadNetworkModule();
		return  Network.NetworkConfigView.NetworkConfigView.instance();
	},
});
```
## Actions
Action extensions describe functionalities DevTools can perform and that the user can trigger, for instance clearing the console or hiding an element in the elements tree. There are different ways in which an action can be triggered, for example using keyboard shortcuts or with the command menu, how an action can be triggered is declared at is registration. An action registration is represented by the `ActionRegistration` interface, declared in [ui/ActionRegistration.ts](./ActionRegistration.ts).

All action extensions  have to be registered using the function `UI.ActionRegistration.registerActionExtension` which expects an object of type `ActionRegistration` as parameter.
=======
# UI extensions

There are two types of extensions defined in this folder: views and actions.

## Views

All user visible panels and panes are registered as `View`s.
A view registration is represented by the `ViewRegistration` interface, declared in [ui/ViewRegistration.ts](./ViewRegistration.ts).
All extensions of type ‘view’ are registered using the function `UI.ViewManager.registerViewExtension` which expects an object of type `ViewRegistration` as parameter.
For a detailed explanation of the behavior of each property, please see the documentation of `ViewRegistration`.

As an example, take the registration of the `Network conditions` pane, which is located in the drawer:

```js
UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: 'network.config',
  commandPrompt: 'Show Network conditions',
  title: ls`Network conditions`,
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 40,
  tags: [
    ls`disk cache`,
    ls`network throttling`,
    ls`useragent`,
    ls`user agent`,
    ls`user-agent`
  ],
  async loadView(): UI.Widget.Widget  {
    const  Network  = await loadNetworkModule();
    return  Network.NetworkConfigView.NetworkConfigView.instance();
  },
});
```

## Actions
Action extensions describe functionalities DevTools can perform and that the user can trigger, for instance clearing the console or hiding an element in the elements tree.
There are different ways in which an action can be triggered: using keyboard shortcuts or with the command menu.
An action registration is represented by the `ActionRegistration` interface, declared in [ui/ActionRegistration.ts](./ActionRegistration.ts).

All action extensions  have to be registered using the function `UI.ActionRegistration.registerActionExtension` which expects an object of type `ActionRegistration` as parameter.
For a detailed explanation of the behavior of each property, please see the documentation of `ActionRegistration`.
>>>>>>> 580d0738b ([module.json extensions] Adds documentation on extension registrations.)

As an example, take the registration of the  `network.toggle-recording` action, which allows to start or stop recording a network log:

```js
UI.ActionRegistration.registerActionExtension({
<<<<<<< HEAD
	actionId:  'network.toggle-recording',
	category: UI.ActionRegistration.ActionCategory.NETWORK,
	iconClass: UI.ActionRegistration.IconClass.LARGEICON_START_RECORDING,
	toggleable:  true,
	toggledIconClass: UI.ActionRegistration.IconClass.LARGEICON_STOP_RECORDING,
	toggleWithRedColor:  true,
	contextTypes()  {
		return maybeRetrieveContextTypes(Network  =>  [Network.NetworkPanel.NetworkPanel]);
	},
	async loadActionDelegate()  {
		const  Network  = await loadNetworkModule();
		return  Network.NetworkPanel.ActionDelegate.instance();
	},
	options:  [
		{
			value:  true,
			title: ls`Record network log`,
		},
		{
			value:  false,
			title: ls`Stop recording network log`,
		},
	],
	bindings:  [
		{
			shortcut:  'Ctrl+E',
			platform: UI.ActionRegistration.Platforms.WindowsLinux,
		},
		{
			shortcut:  'Meta+E',
			platform: UI.ActionRegistration.Platforms.Mac,
		},
	],
});
```
### Important considerations
#### Context types
The `contextTypes` property determines the context under which the action is available. A context, in terms of the application, is defined as set 'flavors' or classes, which usually represent views, that are added and removed to the context as the user interacts with the application (e.g when the user moves across views). (See [`UI.Context`](./Context.js)). Therefore, an action is available for triggering only when at least one of the classes that form its `contextTypes` is part of the flavors that define the application context in a given moment. These flavors can be retrieved invoking the method `flavors` inside the class `UI.Context.Context`.

There is an exception to this rule:  when an action should be available regardless of the application context, that is, it is globally available. In this case, the value of the `contextTypes` property should be declared as undefined (or not declared at all), such action will always be available for triggering.

#### Key bindings

The `bindings` property defines a `platform` and a `keybindSets` properties along with the keyboard shortcut itself. These two extra properties add further constraints (additional to the ones introduced by the `contextTypes` property discussed before) to the conditions that have to be satisfied in order to trigger an action using keyboard shortcuts.

`platform` refers to the OS on which DevTools is running and can be either `mac` or `windows,linux`. `keybindSets` refers to the selected shortcut preset, which can be changed in settings -> shortcuts -> “Match shortcuts from preset”, a key binding will be used when the selected preset matches any of the keybind sets declared by the binding. Equally to `contextTypes`, if a key binding is supposed to be available in all platforms or all keybind sets then the `platform` or the `keybindSets` properties, respectively, have to be declared as undefined (or not declared at all).

Therefore, duplication occurs when a key shortcut is declared more than once for the same platform, keybind set and context type. For example, the following is a form of duplication:


```js
UI.ActionRegistration.registerActionExtension({
	<...>
	contextTypes() {
		return maybeRetrieveContextTypes(Elements => [Elements.ElementsPanel.ElementsPanel]);
	},
	bindings: [
		{
			shortcut: 'Esc',
		},
	],
	<...>
});
```
And
```js
UI.ActionRegistration.registerActionExtension({
	<...>
	contextTypes: undefined,
	bindings: [
		{
			platform: 'windows,linux',
			shortcut: 'Esc',
		},
	],
	<...>
});
```

These two key bindings overlap because both allocate the same key for the `windows, linux` platform (the first one is global across platforms) in the `ElementsPanel` context (the second one is global across context types) and both are global across keybind sets.

If key bindings were declared such that **at least one** of the three variables (`platform, contextTypes` and `keybindSets`) didn't overlap, then no duplication would occur. For example, the following is **not** a form of duplication:

```js
UI.ActionRegistration.registerActionExtension({
	<...>
	contextTypes() {
		return maybeRetrieveContextTypes(Elements => [Elements.ElementsPanel.ElementsPanel]);
	},
	bindings: [
		{
			shortcut: 'Esc',
			keybindSets: ['devToolsDefault'],
		},
	],
	<...>
=======
  actionId:  'network.toggle-recording',
  category: UI.ActionRegistration.ActionCategory.NETWORK,
  iconClass: UI.ActionRegistration.IconClass.LARGEICON_START_RECORDING,
  toggleable:  true,
  toggledIconClass: UI.ActionRegistration.IconClass.LARGEICON_STOP_RECORDING,
  toggleWithRedColor:  true,
  contextTypes(): unknown[] {
    return maybeRetrieveContextTypes(Network  =>  [Network.NetworkPanel.NetworkPanel]);
  },
  async loadActionDelegate(): UI.ActionRegistration.ActionDelegate  {
    const  Network  = await loadNetworkModule();
    return  Network.NetworkPanel.ActionDelegate.instance();
  },
  options:  [
    {
      value:  true,
      title: ls`Record network log`,
    },
    {
      value:  false,
      title: ls`Stop recording network log`,
    },
  ],
  bindings:  [
    {
      shortcut:  'Ctrl+E',
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
    },
    {
      shortcut:  'Meta+E',
      platform: UI.ActionRegistration.Platforms.Mac,
    },
  ],
});
```

### Important considerations

#### Context types
The `contextTypes` property determines the context under which the action is available.
A context is defined as set 'flavors' or classes, which usually represent views, that are added and removed to the context as the user interacts with the application (e.g when the user moves across views).
(See [`UI.Context`](./Context.js)).
Therefore, an action can only be triggered when one of its respective context types is visible.
These flavors can be retrieved invoking the method `flavors` inside the class `UI.Context.Context`.

There is an exception to this rule: for globally available actions, the `contextTypes` property should be declared as undefined (or not declared at all).
In this case, the action will always be available, regardless of which context is visible.

#### Key bindings

The `bindings` property defines a `platform` and a `keybindSets` properties along with the keyboard shortcut itself.
These two extra properties add more conditions (additional to the ones introduced by the `contextTypes` property discussed before) that need to be fulfilled to trigger a particular action.

- `platform` refers to the OS on which DevTools is running and can be either `mac` or `windows,linux`.
- `keybindSets` refers to the selected shortcut preset, which can be changed in `settings -> shortcuts -> “Match shortcuts from preset”`.
A key binding will be used when the selected preset matches any of the keybind sets declared by the binding.

If you don't specify additional constraints, the keybinding will be always available.
It is possible that this results in duplicate keybindings, for example:

```js
UI.ActionRegistration.registerActionExtension({
  contextTypes() {
    return maybeRetrieveContextTypes(Elements => [Elements.ElementsPanel.ElementsPanel]);
  },
  bindings: [
    {
      shortcut: 'Esc',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  contextTypes: undefined,
  bindings: [
    {
      platform: 'windows,linux',
      shortcut: 'Esc',
    },
  ],
});
```

These two key bindings both allocate the same key for the `windows, linux` platform (the first one is global across platforms) in the `ElementsPanel` context (the second one is global across context types) and both are global across keybind sets.

If key bindings were declared such that **at least one** of the three variables (`platform, contextTypes` and `keybindSets`) doesn't overlap, then no duplication would occur.
For example, the following is **not** a form of duplication:

```js
UI.ActionRegistration.registerActionExtension({
  contextTypes() {
    return maybeRetrieveContextTypes(Elements => [Elements.ElementsPanel.ElementsPanel]);
  },
  bindings: [
    {
      shortcut: 'Esc',
      keybindSets: ['devToolsDefault'],
    },
  ],
>>>>>>> 580d0738b ([module.json extensions] Adds documentation on extension registrations.)
});
```
And
```js
UI.ActionRegistration.registerActionExtension({
<<<<<<< HEAD
	<...>
	contextTypes: undefined,
	bindings: [
		{
			platform: 'windows,linux',
			shortcut: 'Esc',
			keybindSets: ['vsCode'],
		},
	],
	<...>
});
```
In this case, because the key binds are declared for different keybind sets, they are not duplicates, regardless of the overlap in the `platform` and `contextTypes` values.

## Settings


Settings represent configurations set to DevTools’ functionalities. Their value can be changed by the user to enable customization of the platform. Some of the settings default values can be changed with the command menu or in the settings tab. An action registration is represented by the `SettingRegistration` interface, declared in [ui/SettingRegistration.ts](./SettingRegistration.ts).

All action extensions  have to be registered using the function `UI.ActionRegistration.registerActionExtension` which expects an object of type `ActionRegistration` as parameter.

As an example, take the registration of the `showHTMLComments` settting,  which allows users to determine if HTML comments are shown in the Elements tree:
```js
Common.Settings.registerSettingExtension({
	category:  Common.Settings.SettingCategoryObject.ELEMENTS,
	order:  3,
	title:  ls`Show HTML comments`,
	settingName:  'showHTMLComments',
	settingType:  Common.Settings.SettingTypeObject.BOOLEAN,
	defaultValue:  true,
	options: [
		{
			value:  true,
			title:  ls`Show HTML comments`,
		},
		{
			value:  false,
			title:  ls`Hide HTML comments`,
		},
	],
});
```

A controller for the each setting is added to the 'preferences' tab if they are visible, that is, they have a `title` and a `category` . They can also be set with the command menu if they have `options` and a `category` (options’ names are added as commands).
=======
  contextTypes: undefined,
  bindings: [
    {
      platform: 'windows,linux',
      shortcut: 'Esc',
      keybindSets: ['vsCode'],
    },
  ],
});
```
In this case, they keybindings are declared for different keybind sets and thus do not result in duplcation.
>>>>>>> 580d0738b ([module.json extensions] Adds documentation on extension registrations.)
