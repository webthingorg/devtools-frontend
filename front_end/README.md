# Registering Extensions

The concept of extensions inside the DevTool's frontend provides a model to add functionalities to the application. This abstraction allows, to some extent, to add basic features programmatically to the application by relying on a declarative system. The system is designed such that the functionalities don't have to be implemented from scratch, but instead the information contained by each extension declaration (registration) is used, along with the model, to 'extend' the system to include support for the functioning of the extension. This way, the developer only has to worry about the final and specific details of the implementation of a functionality that can be added to DevTools as an extension.

The declaration of an extension can have a variety of results: from adding bits of information for the internal business logic, to include features that the user can interact with. There are 4 main types of extensions: 'Action', 'View', 'Setting' and type lookups. An overview on the purpose of each type and on how to use the API disposed for registering extensions is available in [ui/README.md](./ui/README.md).

The declaration of extensions is divided by modules. This way, each module declares the extensions it is related with, be it because the handling of the extensions is implemented inside the module or because the extension requires resources held by the module. For this purpose, a "meta" file, whose name follows the shape `<module>-meta.ts` is included in each module, all the extensions of module must be declared in its `meta` file. The `meta` files are loaded in [devtools_app.js](./devtools_app.js) or in [shell.js](./shell.js), depending on whether the module is a dependency of the [devtools_app](./devtools_app.json) or the [shell](./shell.json) app. Also, a dedicated entry point with the name "meta" is declared in the BUILD .gn for the `meta` file, for example:
```
devtools_entrypoint("meta") {
	entrypoint = "network-meta.ts"
	deps = [
		":bundle",
		"../root:bundle",
		"../ui:bundle",
	]
}
```