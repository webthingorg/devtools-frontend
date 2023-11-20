# Visual Logging

The goal of this project is to improve the logging of user interactions in
DevTools. The current UMA logging is unreliable and inconsistent, and this can lead
incorrect conclusions about how users are interacting with the product.

We want to be able to understand how users are interacting with DevTools so that
we can improve the product. This includes understanding what users are seeing,
what they are interacting with, and how they are using the different features.

## General Approach

We log impressions and interactions for a subtree of the actual DevTools
DOM tree. The logging is based on an HTML attribute and an arbitrary context
value. The context value will be used to provide more information about the
element that is being logged.

The trickiest questions are what elements to log and how to describe them.
There are no hard rules here, we log what we think is helpful to understand user
behavior. Here are some rules of thumbs:

1. Most interactive elements should be logged
1. Elements that only appear under certain conditions should be logged
1. Container elements that will help distinguish common UI elements should be logged

We describe loggable elements as a combination of visual element type and a
context value. Visual element type is a value of `VisualElements` enum defined
in front_end/ui/visual_logging/LoggingConfig.ts. Context could be an arbitrary
string, its 32 bit hash will be logged. No taxonomy is perfect and we are not
trying to create one here, we are trying to make it practical though.

1. Visual element types try to describe function, not appearance. For instance
we have `Toggle` and `Action` as visual elements types, not `Checkbox` and
`Button`. This is important to keep user actions trackable across longer time
horizons, even if the appearance of UI elements change.
1. We also try to have visual element types describe a class of elements, and
context describe a specific instance. For example we log elements panel as
`Panel` visual elements with `elements` as a context, not as `ElementsPanel`.
This not only helps to keep the number of visual element types reasonable, but
also makes it easier to compare relative performance of similar UI elements.
1. We log visual elements as a tree, so it is redundant to include location
information in either visual element type or context. For example, `TreeOutline`
inside `styles` `Pane` inside `elements` `Panel` is unambiguous by itself,
without any extra qualifiers.

## API

In most cases it is enough to put the `jslog` attribute on a corresponding HTML
element. There’s a number of fluent builder functions exported
front_end/ui/visual_logging/visual_logging.ts to build the attribute value.
These are all bound versions of `LoggingConfig.makeConfigStringBuilder` and are
used in the legacy UI as

```
this.element.setAttribute('jslog', `${VisualLogging.panel().context(name)}`);
```

or

```
button.element.setAttribute('jslog', `${VisualLogging.dropDown()
    .track({click: true}).context('renderingEmulations')}`);
```

In the LitHTML the usage is

```
Lit.html`<td jslog=${VisualLogging.tableCell()
        .track({click: true}).context(col.id)}>
```

### jslog Builder API

`track()` method generates a `track: ` clause and specifies exactly what needs to
be logged for the visual elements. If absent, only impressions are logged for
this element. Called with tracking options, an object with the following properties:
* `click`: Whether to track clicks.
* `dblclick`: Whether to track double clicks.
* `hover`: Whether to track hover events.
* `drag`: Whether to track drag events.
* `change`: Whether to track change events.
* `keydown`: Whether to track keydown events. If a string is provided, it will
be used as the key code to track. Otherwise, all keydown events will be tracked.

`context()` method sets the context for the visual logging element. The context
can be a string or a number. If string is given, it would be first considered
to refer to a context provider (see below). If no context provider is registered
with this name, SHA-1 hash will be computed and the first 32 bits
(little endian) will be logged. Number will be logged as is.

`parent()` method sets the custom parent provider for the visual logging element
(see below). If not invoked, the parent visual element will be taken from a DOM tree structure.

### Context and Parent Providers

Context providers are used to generate context value in a runtime. It is used
for both impressions and events. This is useful when relevant information is not
reflected in the DOM, e.g. when a pseudo-element is used to render a tree item
disclosure triangle or canvas is used to draw network waterfall. When logging
impressions, context could indicate if/how many elements are present (0 or 1 for
having a disclosure triangle or not, number of tracks in the waterfall). When
logging events, context could identify what was clicked (1 for disclosure
triangle, 0 for tree item itself, sequence numer of a waterfall track).

As this only logs a single number, this won’t be enough for more complex cases,
like diverse tracks in the Performance panel canvas, or hosted menu. For these
scenarios, see the section below.

To register a context provider, call `VisualLogging.registerContextProvider`.
First argument is a provider name that would later be used as an argument of a
jslog builder `context()` method. Second is function, taking an Element or Event
and returning a number. For disclosure triangle this would be

```
function disclosureTriangleLoggingContextProvider(
    e: VisualLogging.Loggable|Event): Promise<number|undefined> {
  if (e instanceof Element) {
    return Promise.resolve(e.classList.contains('parent') ? 1 : 0);
  }
  if (e instanceof MouseEvent && e.currentTarget instanceof Node) {
    const treeElement = TreeElement.getTreeElementBylistItemNode(e.currentTarget);
    if (treeElement) {
      return Promise.resolve(treeElement.isEventWithinDisclosureTriangle(e) ? 1 : 0);
    }
  }
  return Promise.resolve(undefined);
}


VisualLogging.registerContextProvider('disclosureTriangle',
    disclosureTriangleLoggingContextProvider);

listItemNode.setAttribute('jslog', `${VisualLogging.treeItem()
    .track({click: true}).context('disclosureTriangle')}`);


Similarly parent provides are used to specify a parent visual element in
runtime. This should be used rarely as most of the time, DOM hierarchy is enough
to identify the parent. However, sometimes, markup doesn’t reflect the logical
structure, e.g. legacy tree outline has children in a `<ol>` element, which is a
sibling of a `<li>` specifying the parent. In this case, we could do the following:

```
function loggingParentProvider(e: Element): Element|undefined {
  const treeElement = TreeElement.getTreeElementBylistItemNode(e);
  return treeElement?.parent?.listItemElement;
}

VisualLogging.registerParentProvider('parentTreeItem',
        loggingParentProvider);

this.listItemNode.setAttribute(
       'jslog',
       `${VisualLogging.treeItem().track({click: true}).parent('parentTreeItem')}`);
```

### Logging beyond DOM

Some DevTools UI is not represented in DOM, such as tracks in the performance
panel or native menus. To log these, visula logging library provides an
imperative API. It is meant to be used rarely, when no other options are
available, as it requires manual orchestrating and is subject to the same issues
as UMA histogram logging.

First we need to identify TypeScript type corresponding to the element that
needs to be logged. For example `ContextMenuDescriptor` is used to log native
menu items. This type needs to be added to the `Loggable` type definition in
front_end/ui/visual_logging/Loggable.ts


Then we need to call `registerLoggable` with the corresponding JavaScript
object, config string, in the same format as the `jslog` attribute would have,
and an optional parent JavaScript object. For a native menu item, this would be


```
VisualLogging.registerLoggable(descriptor, `${VisualLogging.action()
    .track({click: true}).context(descriptor.jslogContext)}`,
    parent || descriptors);
```

This only registers the element and doesn’t log anything yet. To log
impressions, one needs to explicitly call `VisualLogging.logImpressions`.
Similarly to log click, `VisualLogging.logClick` needs to be called.

