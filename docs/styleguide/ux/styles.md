# Styles

[TOC]

## Colors

## Usage
**Reference or palette tokens** (e.g. `--ref-palette-X`) are a set of base colors that get updated on Chrome color theme change and should not be directly used.

**System tokens** (e.g. `--sys-color-X`) are a set of semantic tokens (use is often clear from name e.g. `--sys-color-error-container`). They reference palette tokens and incorporate light / dark mode switches and should be used in the code directly.

**Application tokens** (e.g. `--app-color-X`) reference palette tokens, and add more semantic meaning and handle exception cases, where system tokens are not enough. Should be defined for both light and dark modes.

### Dos
* Use system colors (`--sys-color-X`)
* Use application colors (`--app-color-X`) for *rare* deviations

### Don'ts
* Use reference palette colors (`--ref-palette-X`)

### Defaults

#### Background colors

All backgrounds should be either a surface or a container.

* default toolbar color: `--sys-color-cdt-base-container`
* secondary toolbar color (e.g. Sources sidebar section headers like 'Watch' or 'Breakpoints'): `--sys-color-surface2`
* default data grid row color: `--sys-color-cdt-base-container`
* alternating grid row color: `--sys-color-surface1`
* warning message: `--sys-color-surface-yellow`
* error message: `--sys-color-surface-error`
* info message: `--sys-color-cdt-base-container`
* info bar background: `--sys-color-neutral-container`

#### State colors

* hovered: `--sys-color-state-hover-on-subtle`
* selected: `--sys-color-tonal-container`
* focus-visible: `--sys-color-state-focus-highlight`
* text selection over focus: `--sys-color-state-focus-select`

#### Text colors

Text should generally use on-surface, on-container.

* regular (old text-primary): `--sys-color-on-surface`
* fainter (old text-secondary): `--sys-color-on-surface-subtle`
* disabled (old text-disabled): `--sys-color-text-disabled`

For warnings, errors, text on selected/focused UI elements:
* `--sys-color-on-surface-yellow`
* `--sys-color-on-surface-error`
* `--sys-color-on-tonal-container`

#### Syntax highlighting

Syntax highlighting should use `--sys-color-token-X` colors.

#### Icon colors

Regular (dark grey) icons should also use on-something colors:

* default: `--sys-color-on-surface-subtle`
* on hover: `--sys-color-on-surface`
* disabled: `--sys-color-state-disabled`

For colored icons, please use icon application color tokens: `--app-`. In case you need to add a new icon application color token, reference `--sys-color-something-bright`

## Token reference
| CSS token name         | Figma token name |
| ---------------------- | -----------      |
| `--ref-palette-X`      | N/A              |
| `--sys-color-X`        | `sys-X`          |
| `--app-color-X`        | `app-X`          |

## Edge cases
In some cases, we use application-specific colors (`app-color-X`). Application color tokens should be used *sparingly* only, and should reference system color tokens.

## Resources
* [Reference color tokens](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/ui/legacy/tokens.css)
* [System color tokens](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/ui/legacy/themeColors.css)
* [Application color tokens](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/ui/legacy/applicationColorTokens.css)



## Fonts

## Shadows

## Paddings, margins and spacing

## Border radius

## Icons