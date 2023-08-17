// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import * as TimelineComponents from '../../../../../../front_end/panels/timeline/components/components.js';
import * as Coordinator from '../../../../../../front_end/ui/components/render_coordinator/render_coordinator.js';
import {assertShadowRoot, renderElementIntoDOM} from '../../../helpers/DOMHelpers.js';

describe('BreadcrumbsUI', async () => {
  const BreadcrumbsUIComponent = TimelineComponents.BreadcrumbsUI.BreadcrumbsUI;

  it('renders element with one breadcrumb', async () => {
    const coordinator = Coordinator.RenderCoordinator.RenderCoordinator.instance();
    const component = new BreadcrumbsUIComponent();
    renderElementIntoDOM(component);

    const traceWindow: TraceEngine.Types.Timing.TraceWindow = {
      min: TraceEngine.Types.Timing.MicroSeconds(1),
      max: TraceEngine.Types.Timing.MicroSeconds(10),
      range: TraceEngine.Types.Timing.MicroSeconds(9),
    };

    component.data = {
      breadcrumb: {
        window: traceWindow,
        child: null,
      },
    };

    await coordinator.done();
    assertShadowRoot(component.shadowRoot);

    assert.isTrue(component.shadowRoot.querySelectorAll('.breadcrumb').length === 1);
  });
});
