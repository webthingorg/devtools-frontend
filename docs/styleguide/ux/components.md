
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
##### Dos and Don’ts
| Dos | Don'ts |
| --- | ------ |
| Use devtools-button for Primary, Outlined,  Text and Icon buttons | Use `<button>`, as it isn’t readily styled |
| Use ToolbarButton for buttons inside toolbars | Color icon buttons (only in exceptions)|

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
##### Dos and Don'ts


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


