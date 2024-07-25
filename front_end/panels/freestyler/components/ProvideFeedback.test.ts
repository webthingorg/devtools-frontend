// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {renderElementIntoDOM} from '../../../testing/DOMHelpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as Freestyler from '../freestyler.js';

const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
describe('ProvideFeedback', () => {
  it('should show the feedback form', async () => {
    const component = new Freestyler.ProvideFeedback({onFeedbackSubmit: sinon.stub(), canShowFeedbackForm: true});
    renderElementIntoDOM(component);
    await coordinator.done();

    const button = component.shadowRoot!.querySelector('.rate-buttons devtools-button')! as HTMLElement;
    button.click();

    assert(component.shadowRoot!.querySelector('.feedback'));
  });
  it('should not show the feedback form', async () => {
    const component = new Freestyler.ProvideFeedback({onFeedbackSubmit: sinon.stub(), canShowFeedbackForm: false});
    renderElementIntoDOM(component);
    await coordinator.done();

    const button = component.shadowRoot!.querySelector('.rate-buttons devtools-button')! as HTMLElement;
    button.click();

    assert.notExists(component.shadowRoot!.querySelector('.feedback'));
  });
});
