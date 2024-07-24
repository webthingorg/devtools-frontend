
# Components

[TOC]

## Buttons


![Button component](images/button-screenshot.png)

### Variations


![Text button variations](images/button-text-variations.png)

#### Primary buttons

Primary buttons are the most prominent type of button available. They are used for a single, necessary action a developer must complete, or for a highly recommended, promoted action. Use them sparingly and with purpose.
#### Outlined buttons

Outlined buttons are the default button style. Use them for regular actions in the UI or to cancel dialogs.

#### Text buttons
Text buttons are the least prominent button choice. Use them in cases outlined buttons would create too much visual noise.

#### Icon buttons
Use icon buttons in toolbars of contextual actions that shouldn’t take up much space.


![Icon button variations](images/button-icon-variations.png)

### Usage
#### Developer guidelines
##### Dos
* Use [`devtools-button`]() for Primary, Outlined, Text and Icon buttons
* Use [`ToolbarButton`]() for buttons inside toolbars

##### Don'ts
* Use `<button>`, as they are not styled correctly
* Change the default color of icons (only in exceptions)

##### Developer examples

###### Primary button
		Usage within HTML environment:
```html
<devtools-button
      class="some-class"
      .variant=${Buttons.Button.Variant.PRIMARY}
                 .title=${i18nString(UIStrings.someString)}
      .jslogContext=${'some-context')
      @click=${handleClick()}
      )></devtools-button>
```

Usage within legacy code:
```ts
  const button = new Buttons.Button.Button();
  button.data = {
      variant: Buttons.Button.Variant.PRIMARY,
      title: i18nString(UIStrings.someString),
      jslogContext: 'some-context',
    };
  button.classList.add(‘some-class’);
  button.addEventListener(‘click’, () => handleClick());

```
###### Outlined button
###### Text button
###### Icon button

#### Design guidelines
##### Dos
 ![Confirmation Dialog Use](images/button-confirmation-dialog.png)
 * **Confirmation dialogs**: buttons that complete a flow.
  These buttons highlight the actions a developer needs to take to finish a
  task (e.g., "Delete" to remove a file or "Submit" to finalize a form).
  When used in a dialog, always place the primary button on the right side.

 ![Required Action Use](images/button-required-action.png)
 * **Required actions**: use the primary button for actions the developer
   must take every time to use a panel's functionality. Examples include "Start Recording" or "Run Audit."

##### Don'ts
 ![Multiple Primary](images/button-multiple-primary.png)
 * **Avoid multiple primary buttons**: avoid using more than one primary button on a single UI surface. If you have multiple important actions, use outlined buttons.

### Common use cases

### Resources

#### For developers

##### Example link
##### Link to implementation

##### Token names

#### For designers

##### Deep link into Figma
	[Buttons](https://www.figma.com/design/A5iQBBNAe5zPFpJvUzUgW8/CDT-design-kit?node-id=481-2167&m=dev)
[Icon buttons](https://www.figma.com/design/A5iQBBNAe5zPFpJvUzUgW8/CDT-design-kit?node-id=571-616&m=dev)

##### Color tokens

## Side navigation

## Checkboxes


