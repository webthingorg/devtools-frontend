// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as FrontendHelpers from '../../../../../test/unittests/front_end/helpers/EnvironmentHelpers.js';
import * as PanelFeedback from '../../../components/panel_feedback/panel_feedback.js';
import * as LitHtml from '../../../lit-html/lit-html.js';
import * as ComponentHelpers from '../../helpers/helpers.js';

await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();

const html = LitHtml.html`<${PanelFeedback.PanelFeedback.PanelFeedback.litTagName} .data=${{
  feedbackUrl: 'https://www.example.com',
} as PanelFeedback.PanelFeedback.PanelFeedbackData}>
  <x-link slot="quick-start-link" href="https://www.example.com">Quick start: get started with the Recorder</x-link>
</${PanelFeedback.PanelFeedback.PanelFeedback.litTagName}>`;

const container = document.getElementById('container');
if (container) {
  LitHtml.render(html, container);
}
