Localizable strings in the DevTools frontend need to be wrapped in localization calls. There are two different calls.

## i18nString
The basic API to make a string (with or without placeholder) localizable.
The first argument is the string reference in `UIStrings`
The second argument is an object for placeholders (if any)

```javascript
// at the top of example.js file, after import statements

const UIStrings = {
  /**
    * @description This is an example description for my new string with placeholder
    * @example {example for placeholder} PH1
    * @example {example 2 for placeholder 2} PH2
    */
  addAnotherString: 'Another new string I want to add, with {PH1} and {PH2}',
};

message = i18nString(UIStrings.addAnotherString, {PH1: 'a placeholder', PH2: 'another placeholder'});
```

## i18nLazyString
Defers the execution of the localization function. Useful in cases where a string is loaded on a critical path.
Usage is similar to `i18nString`:
  - Verify or add next to your UIStrings structure:
    - `const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);`
  - Use `i18nLazyString` to localize your critical path string.
```javascript
const UIStrings = {
    /**
      * @description A sample string
      */
    sampleString: 'Sample string',
  };
  const str_ = i18n.i18n.registerUIStrings('example.js', UIStrings);
  const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
  const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

  const message = i18nLazyString(UIStrings.sampleString)();
```

## i18n.i18n.getFormatLocalizedString
This call returns a **span element**, not a string. It is used when you want to construct a DOM element with a localizable string, or localizable content that contains some other DOM element.

```javascript
// Create the string in UIString
/**
*@description Message in Coverage View of the Coverage tab
*@example {reload button icon} PH1
*@example {record button icon} PH2
*/
clickTheRecordButtonSToStart: 'Click the reload button {PH1} to reload or record button {PH2} start capturing coverage.',

// Element with localizable content containing two DOM elements that are buttons
const reloadButton = UI.createInlineButton(UI.Toolbar.createActionButtonForId('coverage.start-with-reload'));
const recordButton = UI.createInlineButton(UI.Toolbar.createActionButton(this._toggleRecordAction));
message = i18n.i18n.getFormatLocalizedString(str_, UIStrings.clickTheReloadButtonSToReloadAnd, {PH1: reloadButton, PH2:recordButton });
```
