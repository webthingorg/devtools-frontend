// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../../testing/EnvironmentHelpers.js';
import * as LitHtml from '../../../lit-html/lit-html.js';
import * as UIHelpers from '../../../ui-helpers/ui-helpers.js';
import * as ComponentHelpers from '../../helpers/helpers.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

const plusIcon = 'plus';
const buttonText = 'Click me';

function appendButton(button: symbol|LitHtml.TemplateResult, divCount: number): void {
  const container = document.querySelector('#container') as HTMLElement;
  const div = document.createElement('div');
  div.id = `div-${divCount}`;
  LitHtml.render(button, div);
  container.appendChild(div);
}

const primaryWithIcon = UIHelpers.Button.createButton(UIHelpers.Button.Type.Primary, plusIcon, buttonText);
const primaryText = UIHelpers.Button.createButton(UIHelpers.Button.Type.Primary, undefined, buttonText);
const primaryDisabled = UIHelpers.Button.createButton(UIHelpers.Button.Type.Primary, plusIcon, buttonText);
const outlineWithIcon = UIHelpers.Button.createButton(UIHelpers.Button.Type.Outlined, plusIcon, buttonText);
const outlineText = UIHelpers.Button.createButton(UIHelpers.Button.Type.Outlined, undefined, buttonText);
const outlinedDisabled = UIHelpers.Button.createButton(UIHelpers.Button.Type.Outlined, plusIcon, buttonText);
const textWithIcon = UIHelpers.Button.createButton(UIHelpers.Button.Type.Text, plusIcon, buttonText);
const textButton = UIHelpers.Button.createButton(UIHelpers.Button.Type.Text, undefined, buttonText);
const textDisabled = UIHelpers.Button.createButton(UIHelpers.Button.Type.Text, plusIcon, buttonText);
const microWithIcon = UIHelpers.Button.createButton(UIHelpers.Button.Type.Micro, plusIcon, buttonText);
const microText = UIHelpers.Button.createButton(UIHelpers.Button.Type.Micro, undefined, buttonText);
const microDisabled = UIHelpers.Button.createButton(UIHelpers.Button.Type.Micro, plusIcon, buttonText);
const iconButton = UIHelpers.Button.createButton(UIHelpers.Button.Type.Icon, plusIcon, undefined);
const iconButtonScissors = UIHelpers.Button.createButton(UIHelpers.Button.Type.Icon, plusIcon, undefined);
const iconDisabled = UIHelpers.Button.createButton(UIHelpers.Button.Type.Icon, plusIcon, undefined);

const buttons = [
  primaryWithIcon,
  primaryText,
  primaryDisabled,
  outlineWithIcon,
  outlineText,
  outlinedDisabled,
  textWithIcon,
  textButton,
  textDisabled,
  microWithIcon,
  microText,
  microDisabled,
  iconButton,
  iconButtonScissors,
  iconDisabled,
];

let divCount = 0;
buttons.map(button => {
  appendButton(button, divCount);
  if ([2, 5, 8, 11, 14].includes(divCount)) {
    document.getElementById(`div-${divCount}`)?.querySelector('button')?.toggleAttribute('disabled');
  }
  divCount++;
});
