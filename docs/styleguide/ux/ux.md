# Chromium DevTools UX Style Guide

[TOC]

## How to organize UI

### Panels and Tabs

The main DevTools UI is organized into panels and tabs.

## How to style UI

### Background colors

All backgrounds should be either a surface or a container
- default toolbar color: `--sys-color-cdt-base-container`
- secondary toolbar color (e.g. Sources sidebar section headers like 'Watch' or 'Breakpoints'): `--sys-color-surface2`
- default data grid row color: `--sys-color-cdt-base-container`
- alternating grid row color: `--sys-color-surface1`
- warning message: `--sys-color-surface-yellow`
- error message: `--sys-color-surface-error`
- info message: `--sys-color-cdt-base-container`
- info bar background: `--sys-color-neutral-container`

States:

- hovered: `--sys-color-state-hover-on-subtle`
- selected: `--sys-color-tonal-container`
- focus-visible: `--sys-color-state-focus-highlight`
- text selection over focus: `--sys-color-state-focus-select`

*** aside
**NOTE:** For hover/focus colors for elements which background color is other than `--sys-color-cdt-base-container`
    or in case you need an opaque hover color use [state layer technique](https://carbon.googleplex.com/google-material-3/pages/interaction-states/state-layers).
    See [example CL](http://crrev.com/c/5003859)
***

### Text colors

Text should generally use on-surface, on-container
- regular (old text-primary): `--sys-color-on-surface`
- fainter (old text-secondary): `--sys-color-on-surface-subtle`
- disabled (old text-disabled): `--sys-color-text-disabled`

For warnings, errors, text on selected/focused UI elements:
- `--sys-color-on-surface-yellow`
- `--sys-color-on-surface-error`
- `--sys-color-on-tonal-container`

### Syntax highlighting

Syntax highlighting should use token-something colors defined [here](http://crsrc.org/c/third_party/devtools-frontend/src/front_end/ui/legacy/themeColors.css;l=355)

### Icon colors

Regular (dark grey) icons should also use on-something colors
- default: `--sys-color-on-surface-subtle`
- on hover: `--sys-color-on-surface`
- disabled: `--sys-color-state-disabled`

For colored icons, please use icon application color tokens
In case you need to add a new icon application color token, reference `--sys-color-something-bright`

### Other elements

In case you can’t reuse a component and need to add some new UI element, please follow the [spec](https://www.figma.com/file/5xWeeSmVQTd4yW3s6aFJ1f/CDDS-UX%2FEng-Spec-(NO-LONGER-UPDATED)?node-id=35%3A2599&mode=dev)


## How to write Text

### Capitalization guidelines

#### Capitalize product names

Capitalize [product names](https://developers.google.com/style/product-names#capitalize),
web API names, but not [feature names](https://developers.google.com/style/product-names#feature-names).

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Chrome DevTools (product) lets you debug Background Fetch API (web API) by
logging background fetch (feature) events.
</td>
<td style="background:#fdd">
Chrome devtools lets you debug background fetch API by logging
Background Fetch events.
</td>
</tr>
</table>

#### Use sentence case

Use sentence case in [UI element names](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices#fc5c2a78-f4bf-4d42-bdac-42ff80391129) as well as [titles and headings in text](https://developers.google.com/style/capitalization#capitalization-in-titles-and-headings).

That is, capitalize only the first word in the title, the first word in a
subheading after a colon, and any proper nouns or other terms that are
always capitalized a certain way.

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Network request blocking
</td>
<td style="background:#fdd">
Network Request Blocking
</td>
</tr>
<tr style="font-family:monospace">
<td style="background:#dfd">
Blocked response cookies
</td>
<td style="background:#fdd">
blocked response cookies
</td>
</tr>
</table>

#### Spell UI elements in text

When mentioning [UI elements in text](https://developers.google.com/style/ui-elements#formatting),
spell their names in bold and exactly as they are spelled, including
capitalization, which should be in sentence case. If an element doesn't have a
name however, <em>don't</em> capitalize its term and <em>don't</em> spell it in
bold.

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Open the <b>Network request blocking</b> panel.
</td>
<td style="background:#fdd">
Open the Network request blocking panel.
</td>
</tr>
<tr style="font-family:monospace">
<td style="background:#dfd">
A filter bar at the top of the Network panel.
</td>
<td style="background:#fdd">
A Filter bar at the top of the Network panel.
</td>
</tr>
</table>

*** note
**Tip:** You can "stack" navigation paths in text regardless of element type.
For example:

In **Settings** > **Preferences** > **Appearance** > **Panel layout**,
select `auto`.

That was [Panel] > [Tab] > [Section] > [Drop-down menu].
***

## Glossary

