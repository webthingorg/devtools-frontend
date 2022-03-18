// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as ColorPicker from '../../../ui/legacy/components/color_picker/color_picker.js';
import * as InlineEditor from '../../../ui/legacy/components/inline_editor/inline_editor.js';

import type {LayoutElement} from './LayoutPane.js';

export class LayoutColorSwatchPopoverIcon {
  readonly #swatchPopoverHelper: InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper;
  #swatch: InlineEditor.ColorSwatch.ColorSwatch;
  #contrastInfo: ColorPicker.ContrastInfo.ContrastInfo|null;
  readonly #boundSpectrumChanged: (event: Common.EventTarget.EventTargetEvent<string>) => void;
  readonly #boundOnScroll: (event: Event) => void;
  #spectrum?: ColorPicker.Spectrum.Spectrum;
  #scrollerElement?: Element;
  #colorCallback: Function|null;
  #element: LayoutElement|null;

  constructor(
      swatchPopoverHelper: InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper,
      swatch: InlineEditor.ColorSwatch.ColorSwatch) {
    this.#swatchPopoverHelper = swatchPopoverHelper;
    this.#swatch = swatch;
    this.#swatch.addEventListener(InlineEditor.ColorSwatch.ClickEvent.eventName, this.#iconClick.bind(this));
    this.#contrastInfo = null;

    this.#boundSpectrumChanged = this.#spectrumChanged.bind(this);
    this.#boundOnScroll = this.#onScroll.bind(this);
    this.#colorCallback = null;
    this.#element = null;
  }

  setContrastInfo(contrastInfo: ColorPicker.ContrastInfo.ContrastInfo): void {
    this.#contrastInfo = contrastInfo;
  }

  #iconClick(event: Event): void {
    event.consume(true);
    this.showPopover();
  }

  showPopover(): void {
    if (this.#swatchPopoverHelper.isShowing()) {
      this.#swatchPopoverHelper.hide(true);
      return;
    }

    const color = this.#swatch.getColor();
    let format = this.#swatch.getFormat();
    if (!color || !format) {
      return;
    }

    if (format === Common.Color.Format.Original) {
      format = color.format();
    }
    this.#spectrum = new ColorPicker.Spectrum.Spectrum(this.#contrastInfo);
    this.#spectrum.setColor(color, format);
    this.#spectrum.addEventListener(ColorPicker.Spectrum.Events.SizeChanged, this.#spectrumResized, this);
    this.#spectrum.addEventListener(ColorPicker.Spectrum.Events.ColorChanged, this.#boundSpectrumChanged);
    this.#swatchPopoverHelper.show(this.#spectrum, this.#swatch, this.#onPopoverHidden.bind(this));
    this.#scrollerElement = this.#swatch.enclosingNodeOrSelfWithClass('style-panes-wrapper');
    if (this.#scrollerElement) {
      this.#scrollerElement.addEventListener('scroll', this.#boundOnScroll, false);
    }
  }

  #spectrumResized(): void {
    this.#swatchPopoverHelper.reposition();
  }

  #spectrumChanged(event: Common.EventTarget.EventTargetEvent<string>): void {
    const color = Common.Color.Color.parse(event.data);
    if (!color) {
      return;
    }

    const colorName = this.#spectrum ? this.#spectrum.colorName() : undefined;
    const text = colorName && colorName.startsWith('--') ? `var(${colorName})` : color.asString();

    this.#swatch.renderColor(color);
    const value = this.#swatch.firstElementChild;
    if (value) {
      value.remove();
      this.#swatch.createChild('span').textContent = text;
    }

    if (this.#colorCallback) {
      this.#colorCallback(this.#element, color);
    }
  }

  #onScroll(_event: Event): void {
    this.#swatchPopoverHelper.hide(true);
  }

  #onPopoverHidden(): void {
    if (this.#scrollerElement) {
      this.#scrollerElement.removeEventListener('scroll', this.#boundOnScroll, false);
    }

    if (this.#spectrum) {
      this.#spectrum.removeEventListener(ColorPicker.Spectrum.Events.ColorChanged, this.#boundSpectrumChanged);
    }
    this.#spectrum = undefined;
  }

  setColorCallback(func: Function, element: LayoutElement): void {
    this.#colorCallback = func;
    this.#element = element;
  }
}
