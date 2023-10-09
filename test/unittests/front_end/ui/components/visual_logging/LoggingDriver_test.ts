// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../../../../../front_end/core/host/host.js';
import * as VisualLogging from '../../../../../../front_end/ui/components/visual_logging/visual_logging-testing.js';
import {renderElementIntoDOM} from '../../../helpers/DOMHelpers.js';

const {assert} = chai;

describe('LoggingDriver', () => {
  let parent: HTMLElement;
  let element: HTMLElement;

  beforeEach(() => {
    VisualLogging.LoggingState.resetStateForTesting();
    parent = document.createElement('div') as HTMLElement;
    parent.setAttribute('jslog', 'TreeItem');
    parent.style.width = '300px';
    parent.style.height = '300px';
    element = document.createElement('div') as HTMLElement;
    element.setAttribute('jslog', 'TreeItem; context:42');
    element.style.width = '300px';
    element.style.height = '300px';
    parent.appendChild(element);
    renderElementIntoDOM(parent);
  });

  it('logs impressions on startLogging', () => {
    const recordImpression = sinon.stub(
        Host.InspectorFrontendHost.InspectorFrontendHostInstance,
        'recordImpression',
    );
    VisualLogging.LoggingDriver.startLogging();
    assert.isTrue(recordImpression.calledOnce);
    assert.sameDeepMembers(
        recordImpression.firstCall.firstArg.impressions, [{id: 2, type: 1, context: 42, parent: 1}, {id: 1, type: 1}]);
  });

  // TODO(dsv): Add more tests
});
