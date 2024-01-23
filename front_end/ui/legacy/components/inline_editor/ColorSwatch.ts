// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as Host from '../../../../core/host/host.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../components/helpers/helpers.js';
import * as ColorPicker from '../../../legacy/components/color_picker/color_picker.js';
import * as LitHtml from '../../../lit-html/lit-html.js';
import * as VisualLogging from '../../../visual_logging/visual_logging.js';

import colorSwatchStyles from './colorSwatch.css.js';
import {type SwatchPopoverHelper} from './SwatchPopoverHelper.js';

const UIStrings = {
  /**
   *@description Icon element title in Color Swatch of the inline editor in the Styles tab
   */
  shiftclickToChangeColorFormat: 'Shift-click to change color format',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/inline_editor/ColorSwatch.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class PopoverEvent extends Event {
  static readonly eventName = 'popover';

  data: {state: 'shown'|'committed'|'hidden'};

  constructor(state: 'shown'|'committed'|'hidden') {
    super(PopoverEvent.eventName, {});
    this.data = {state};
  }
}

export class ColorValueChangedEvent extends Event {
  static readonly eventName = 'colorvaluechanged';

  data: {color: Common.Color.Color|null};

  constructor(color: Common.Color.Color|null) {
    super(ColorValueChangedEvent.eventName, {});
    this.data = {color};
  }
}

export class ColorFormatChangedEvent extends Event {
  static readonly eventName = 'colorformatchanged';

  data: {text: string, format: Common.Color.Format};

  constructor(text: string, format: Common.Color.Format) {
    super(ColorFormatChangedEvent.eventName, {});
    this.data = {text, format};
  }
}

export class ColorEditedEvent extends Event {
  static readonly eventName = 'coloredited';

  data: {text: string, color: Common.Color.Color};

  constructor(text: string, color: Common.Color.Color) {
    super(ColorEditedEvent.eventName, {});
    this.data = {text, color};
  }
}

export class ColorSwatch extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-color-swatch`;
  private readonly shadow = this.attachShadow({mode: 'open'});
  private tooltip: string = i18nString(UIStrings.shiftclickToChangeColorFormat);
  private text: string|null = null;
  private color: Common.Color.Color|null = null;
  private format: Common.Color.Format|null = null;

  private canChangeFormat: boolean = false;
  private canEdit: boolean = false;

  private spectrum: ColorPicker.Spectrum.Spectrum|undefined;
  private contrastInfo: ColorPicker.ContrastInfo.ContrastInfo|undefined;
  private readonly boundSpectrumChanged: (event: Common.EventTarget.EventTargetEvent<string>) => void;
  private swatchPopoverHelper: SwatchPopoverHelper|undefined;
  palette: ColorPicker.Spectrum.Palette|undefined;

  constructor() {
    super();
    this.shadow.adoptedStyleSheets = [
      colorSwatchStyles,
    ];
    this.boundSpectrumChanged = this.spectrumChanged.bind(this);
  }

  setContrastInfo(contrastInfo: ColorPicker.ContrastInfo.ContrastInfo): void {
    this.contrastInfo = contrastInfo;
  }

  private iconClick(event: Event): void {
    event.consume(true);
    this.showPopover();
  }

  async toggleEyeDropper(): Promise<void> {
    await this.spectrum?.toggleColorPicker();
  }

  setPopoverContext(context: {swatchPopoverHelper: SwatchPopoverHelper, palette: ColorPicker.Spectrum.Palette}|
                    undefined): void {
    this.swatchPopoverHelper = context?.swatchPopoverHelper;
    this.palette = context?.palette;
  }

  override showPopover(): void {
    if (!this.swatchPopoverHelper) {
      return;
    }

    if (this.swatchPopoverHelper.isShowing()) {
      this.swatchPopoverHelper.hide(true);
      return;
    }

    const color = this.getColor();
    const format = this.getFormat();
    if (!color || !format) {
      return;
    }

    this.spectrum = new ColorPicker.Spectrum.Spectrum(this.contrastInfo);
    this.spectrum.setColor(color, format);
    if (this.palette) {
      this.spectrum.addPalette(this.palette);
    }

    this.spectrum.addEventListener(ColorPicker.Spectrum.Events.SizeChanged, this.spectrumResized, this);
    this.spectrum.addEventListener(ColorPicker.Spectrum.Events.ColorChanged, this.boundSpectrumChanged);
    this.swatchPopoverHelper.show(this.spectrum, this, this.onPopoverHidden.bind(this));
    this.dispatchEvent(new PopoverEvent('shown'));

    Host.userMetrics.colorPickerOpenedFrom(Host.UserMetrics.ColorPickerOpenedFrom.StylesPane);
  }

  private spectrumResized(): void {
    this.swatchPopoverHelper?.reposition();
  }

  private async spectrumChanged(event: Common.EventTarget.EventTargetEvent<string>): Promise<void> {
    const color = Common.Color.parse(event.data);
    if (!color) {
      return;
    }

    const colorName = this.spectrum ? this.spectrum.colorName() : undefined;
    const text =
        colorName && colorName.startsWith('--') ? `var(${colorName})` : (color.getAuthoredText() ?? color.asString());

    this.renderColor(color);
    if (text) {
      this.dispatchEvent(new ColorEditedEvent(text, color));
    }
  }

  override hidePopover(): void {
    this.swatchPopoverHelper?.hide(true);
  }

  private onPopoverHidden(commitEdit: boolean): void {
    if (this.spectrum) {
      this.spectrum.removeEventListener(ColorPicker.Spectrum.Events.ColorChanged, this.boundSpectrumChanged);
    }
    this.spectrum = undefined;
    this.dispatchEvent(new PopoverEvent(commitEdit ? 'committed' : 'hidden'));
  }

  static isColorSwatch(element: Element): element is ColorSwatch {
    return element.localName === 'devtools-color-swatch';
  }

  setCanChangeFormat(canChangeFormat: boolean): void {
    if (this.canChangeFormat === canChangeFormat) {
      return;
    }

    this.canChangeFormat = canChangeFormat;
    this.render();
  }

  getColor(): Common.Color.Color|null {
    return this.color;
  }

  getFormat(): Common.Color.Format|null {
    return this.format;
  }

  getText(): string|null {
    return this.text;
  }

  get anchorBox(): AnchorBox|null {
    const swatch = this.shadow.querySelector('.color-swatch');
    return swatch ? swatch.boxInWindow() : null;
  }

  /**
   * Render this swatch given a color object or text to be parsed as a color.
   * @param color The color object or string to use for this swatch.
   * @param formatOrUseUserSetting Either the format to be used as a string, or true to auto-detect the user-set format.
   * @param tooltip The tooltip to use on the swatch.
   */
  renderColor(color: Common.Color.Color|string, formatOrUseUserSetting?: string|boolean, tooltip?: string): void {
    if (typeof color === 'string') {
      this.color = Common.Color.parse(color);
    } else {
      this.color = color;
    }

    if (typeof formatOrUseUserSetting === 'string') {
      this.format = Common.Color.getFormat(formatOrUseUserSetting);
    } else {
      this.format = this.color?.format() ?? null;
    }

    if (this.color) {
      this.text = this.color.getAuthoredText() ?? this.color.asString(this.format ?? undefined);
    } else if (typeof color === 'string') {
      this.text = color;
    }

    if (tooltip) {
      this.tooltip = tooltip;
    }

    this.render();
    this.dispatchEvent(new ColorValueChangedEvent(this.color));
  }

  private renderTextOnly(): void {
    // Non-color values can be passed to the component (like 'none' from border style).
    LitHtml.render(this.text, this.shadow, {host: this});
  }

  private render(): void {
    if (!this.color) {
      this.renderTextOnly();
      return;
    }

    const colorSwatchClasses = LitHtml.Directives.classMap({
      'color-swatch': true,
      'readonly': !this.canChangeFormat && !this.swatchPopoverHelper,
    });

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    // Note that we use a <slot> with a default value here to display the color text. Consumers of this component are
    // free to append any content to replace what is being shown here.
    // Note also that whitespace between nodes is removed on purpose to avoid pushing these elements apart. Do not
    // re-format the HTML code.
    LitHtml.render(
      LitHtml.html`<span class=${colorSwatchClasses} title=${this.tooltip}><span class="color-swatch-inner"
        style="background-color: ${this.text};"
        jslog=${VisualLogging.showStyleEditor().track({click: true}).context('color')}
        @click=${this.onClick}
        @mousedown=${this.consume}
        @dblclick=${this.consume}></span></span><slot><span>${this.text}</span></slot>`,
      this.shadow, {host: this});
    // clang-format on
  }

  private onClick(e: KeyboardEvent): void {
    // FIXME Is it okay to do this unconditionally?
    Host.userMetrics.swatchActivated(Host.UserMetrics.SwatchType.Color);
    if (e.shiftKey && this.canChangeFormat) {
      e.stopPropagation();
      this.showFormatPicker(e);
      return;
    }

    this.showPopover();
  }

  private consume(e: Event): void {
    e.stopPropagation();
  }

  setFormat(format: Common.Color.Format): void {
    if (!this.canChangeFormat) {
      return;
    }
    const newColor = this.color?.as(format);
    const text = newColor?.asString();
    if (!newColor || !text) {
      return;
    }
    this.color = newColor;
    this.format = this.color.format();
    this.text = text;
    this.render();
    this.dispatchEvent(new ColorFormatChangedEvent(this.text, this.color.format()));
  }

  private showFormatPicker(e: Event): void {
    if (!this.color || !this.format) {
      return;
    }

    const contextMenu = new ColorPicker.FormatPickerContextMenu.FormatPickerContextMenu(this.color, this.format);
    void contextMenu.show(e, format => {
      this.setFormat(format);
      Host.userMetrics.colorConvertedFrom(Host.UserMetrics.ColorConvertedFrom.ColorSwatch);
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-color-swatch', ColorSwatch);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-color-swatch': ColorSwatch;
  }

  interface HTMLElementEventMap {
    [ColorValueChangedEvent.eventName]: ColorValueChangedEvent;
    [ColorFormatChangedEvent.eventName]: ColorFormatChangedEvent;
    [ColorEditedEvent.eventName]: ColorEditedEvent;
    [PopoverEvent.eventName]: PopoverEvent;
  }
}
