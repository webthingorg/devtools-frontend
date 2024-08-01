// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../../lit-html/lit-html.js';
import * as ComponentHelpers from '../../helpers/helpers.js';

await ComponentHelpers.ComponentServerSetup.setup();

const THEME_VARIABLES_NAMES = new Set([

]);

function appendStyles(mode: 'light'|'dark') {
  const container = document.querySelector(`.${mode}-mode-container`) as HTMLElement;
  const listItems = Array.from(THEME_VARIABLES_NAMES).map(varName => {
    const value = getComputedStyle(container).getPropertyValue(varName);
    if (!value) {
      throw new Error(`Could not find value for CSS variable ${varName}.`);
    }
    let styles = {};
    if (varName.includes('--box-shadow')) {
      styles = {boxShadow: `0 0 0 1px var(${varName})`, borderBottomWidth: 0};

    } else if (varName.includes('--drop-shadow')) {
      styles = {boxShadow: `var(${varName})`, borderBottomWidth: 0};

    } else {
      styles = {borderBottomColor: `var(${varName})`};
    }
    const liStyles = LitHtml.Directives.styleMap(styles);
    return LitHtml.html`<li style=${liStyles}><code>${varName}: ${value}</code></li>`;
  });
  LitHtml.render(LitHtml.html`${listItems}`, container);
}

appendStyles('light');
appendStyles('dark');
