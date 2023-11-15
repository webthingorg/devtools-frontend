// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as VisualLogging from '../../../../../front_end/ui/visual_logging/visual_logging-testing.js';

const {assert} = chai;

describe('LoggingConfig', () => {
  let element: Element;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('identifies if element needs logging', () => {
    assert.isFalse(VisualLogging.LoggingConfig.needsLogging(element));

    element.setAttribute('jslog', 'TreeItem');
    assert.isTrue(VisualLogging.LoggingConfig.needsLogging(element));
  });

  describe('reads simple logging config', () => {
    it('for TreeItem', () => {
      element.setAttribute('jslog', 'TreeItem');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 1);
    });

    it('for TextField', () => {
      element.setAttribute('jslog', 'TextField');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 8);
    });

    it('for RenderingPanel', () => {
      element.setAttribute('jslog', 'RenderingPanel');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 61);
    });

    it('for Preview', () => {
      element.setAttribute('jslog', 'Preview');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 35);
    });

    it('for DeveloperResourcesPanel', () => {
      element.setAttribute('jslog', 'DeveloperResourcesPanel');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 68);
    });

    it('for TableHeader', () => {
      element.setAttribute('jslog', 'TableHeader');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 69);
    });

    it('for TableCell', () => {
      element.setAttribute('jslog', 'TableCell');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 70);
    });

    it('for SearchPanel', () => {
      element.setAttribute('jslog', 'SearchPanel');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 71);
    });

    it('for Clear', () => {
      element.setAttribute('jslog', 'Clear');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 72);
    });

    it('for Revert', () => {
      element.setAttribute('jslog', 'Revert');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 73);
    });

    it('for ChangesPanel', () => {
      element.setAttribute('jslog', 'ChangesPanel');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 74);
    });

    it('for SensorsPanel', () => {
      element.setAttribute('jslog', 'SensorsPanel');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 75);
    });

    it('for SensorsLocationSection', () => {
      element.setAttribute('jslog', 'SensorsLocationSection');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 76);
    });

    it('for SensorsManageLocations', () => {
      element.setAttribute('jslog', 'SensorsManageLocations');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 77);
    });

    it('for SensorsOrientationSection', () => {
      element.setAttribute('jslog', 'SensorsOrientationSection');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 78);
    });

    it('for Reset', () => {
      element.setAttribute('jslog', 'Reset');
      const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
      assert.strictEqual(config.ve, 79);
    });
  });

  it('throws on unknown visual element', () => {
    element.setAttribute('jslog', 'NonExistentVisualElement');
    assert.throws(() => VisualLogging.LoggingConfig.getLoggingConfig(element));
  });

  it('can parse complex track attribute', () => {
    element.setAttribute('jslog', 'TreeItem; track:click, keydown: Enter; context:42');
    const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
    assert.deepEqual(config.track, new Map([['click', undefined], ['keydown', 'Enter']]));
  });

  it('can parse simple context attribute', () => {
    element.setAttribute('jslog', 'TreeItem;context:42');
    const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
    assert.strictEqual(config.context, '42');
  });

  it('can parse parent attribute', () => {
    element.setAttribute('jslog', 'TreeItem;parent:customProvider');
    const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
    assert.strictEqual(config.parent, 'customProvider');
  });

  it('ignores whitespaces while parsnng', () => {
    element.setAttribute('jslog', 'TreeItem;     context:   42');
    const config = VisualLogging.LoggingConfig.getLoggingConfig(element);
    assert.strictEqual(config.context, '42');
  });

  it('builds a string config', () => {
    const treeItem = VisualLogging.LoggingConfig.makeConfigStringBuilder.bind(null, 'TreeItem');
    assert.strictEqual(`${treeItem()}`, 'TreeItem');
    assert.strictEqual(`${treeItem().context(42)}`, 'TreeItem; context: 42');
    assert.strictEqual(`${treeItem().track({click: true})}`, 'TreeItem; track: click');
    assert.strictEqual(`${treeItem().track({click: true, change: true})}`, 'TreeItem; track: click, change');
    assert.strictEqual(`${treeItem().track({keydown: 'Enter'})}`, 'TreeItem; track: keydown: Enter');
    assert.strictEqual(
        `${treeItem().context(42).track({keydown: 'Enter'})}`, 'TreeItem; context: 42; track: keydown: Enter');
  });
});
