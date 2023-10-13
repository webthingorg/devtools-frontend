// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Overlay} from './common.js';
import {generateLegibleTextColor} from './css_grid_label_helpers.js';

const darkGridColor = 'rgba(0 0 0 / 0.7)';
const gridBackgroundColor = 'rgba(156 206 232 / 0.95)';

function formatNumber(n: number): string {
  return n % 1 ? n.toFixed(2) : String(n);
}

interface WindowControlsOverlayConfig {
  /**
   * Whether to show the title bar CSS
   */
  showCSS: boolean;
  /**
   * Seleted platforms to show the overlay
   */
  selectedPlatform: string;
  /**
   * The theme color defined in app manifest
   */
  themeColor: string;
}

export class WindowControlsOverlay extends Overlay {
  private winLinuxToolbarRight!: HTMLElement;
  private macToolbarRight!: HTMLElement;
  private macToolbarLeft!: HTMLElement;
  private config?: WindowControlsOverlayConfig;

  constructor(window: Window, style: CSSStyleSheet[] = []) {
    super(window, style);
  }

  override install() {
    // Initialize overlays for Windows, Linux, and Mac
    const winLinuxToolbarRight = this.document.createElement('div');
    winLinuxToolbarRight.classList.add('image-group-right');

    const windowControlsOverlayIcons = ['chevron', 'ellipsis', 'minimize', 'maximize', 'close'];

    for (const iconName of windowControlsOverlayIcons) {
      const icon = this.document.createElement('div');
      icon.id = iconName;
      icon.classList.add('image');
      winLinuxToolbarRight.append(icon);
    }
    this.winLinuxToolbarRight = winLinuxToolbarRight;

    const macToolbarLeft = this.document.createElement('div');
    macToolbarLeft.classList.add('image-group-left');
    macToolbarLeft.classList.add('mac-left-image-group');
    const wcoMacLeft = ['mac-close', 'mac-minimize', 'mac-maximize'];

    for (const iconName of wcoMacLeft) {
      const icon = this.document.createElement('div');
      icon.id = iconName;
      icon.classList.add(`${iconName}-color`);
      macToolbarLeft.append(icon);
    }
    this.macToolbarLeft = macToolbarLeft;

    const macToolbarRight = this.document.createElement('div');
    macToolbarRight.classList.add('image-group-right');
    macToolbarRight.classList.add('mac-right-image-group');
    const wcoMacRight = ['mac-chevron', 'mac-ellipsis'];

    for (const iconName of wcoMacRight) {
      const icon = this.document.createElement('div');
      icon.id = iconName;
      icon.classList.add(iconName);
      macToolbarRight.append(icon);
    }
    this.macToolbarRight = macToolbarRight;

    this.document.body.append(macToolbarLeft);
    this.document.body.append(macToolbarRight);
    this.document.body.append(winLinuxToolbarRight);

    this.document.body.classList.add('fill');
    const canvas = this.document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.classList.add('fill');
    this.document.body.append(canvas);
    this.setCanvas(canvas);

    super.install();
  }

  override uninstall() {
    this.document.body.classList.remove('fill');
    this.document.body.innerHTML = '';
    super.uninstall();
  }

  drawWindowControlsOverlay(config: WindowControlsOverlayConfig) {
    if (config.showCSS) {
      // Display the Window Controls CSS Vars Overlay
      this.drawTitlebarAreaCSSVarsForPlatform(config.selectedPlatform);
    }

    // Display the Window Controls Overlay
    if (config.selectedPlatform === 'Windows' || config.selectedPlatform === 'Linux') {
      this.macToolbarRight.classList.add('hidden');
      this.macToolbarLeft.classList.add('hidden');
      this.winLinuxToolbarRight.classList.remove('hidden');
      this.winLinuxToolbarRight.classList.remove(`${this.config?.selectedPlatform}-right-image-group`);
      this.winLinuxToolbarRight.classList.add(`${config.selectedPlatform}-right-image-group`);
    } else {
      this.macToolbarRight.classList.remove('hidden');
      this.macToolbarLeft.classList.remove('hidden');
      this.winLinuxToolbarRight.classList.add('hidden');
    }

    // Set the theme Color
    this.document.documentElement.style.setProperty('--wco-theme-color', config.themeColor);
    this.document.documentElement.style.setProperty('--wco-icon-color', generateLegibleTextColor(config.themeColor));

    // Save the current config
    this.config = config;
  }

  drawTitlebarAreaCSSVarsForPlatform(platfom: string) {
    const cssVarsSizes = {
      mac: {width: 185, height: 40},
      linux: {width: 196, height: 34},
      windows: {width: 238, height: 33},
    };
    const viewportSize = this.viewportSizeForMediaQueries || this.viewportSize;
    const barSize = cssVarsSizes[platfom.toLowerCase() as keyof typeof cssVarsSizes];
    const text = `titlebar-area-width: ${formatNumber(viewportSize.width - barSize.width)}px \n titlebar-area-height: ${
        barSize.height}px`;

    this.drawTitlebarAreaCSSVars(text);
  }

  drawTitlebarAreaCSSVars(text: string) {
    const canvasWidth = this.canvasWidth || 0;
    this.context.save();
    this.context.font = `14px ${this.window.getComputedStyle(document.body).fontFamily}`;
    const textWidth = this.context.measureText(text).width;
    const midpoint = (canvasWidth / 2) - (textWidth / 2) + 6;
    this.context.fillStyle = gridBackgroundColor;
    this.context.fillRect(midpoint, 38, textWidth + 12, 25);
    this.context.fillStyle = darkGridColor;
    this.context.fillText(text, midpoint + 3, 54);
    this.context.restore();
  }
}
