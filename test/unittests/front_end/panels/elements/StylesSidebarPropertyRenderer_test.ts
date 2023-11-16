// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../../front_end/panels/elements/elements.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';

describeWithEnvironment('StylesSidebarPropertyRenderer', () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../../front_end/panels/elements/elements.js');
  });

  it('parses animation-name correctly', () => {
    const throwingHandler = () => {
      throw new Error('Invalid handler called');
    };
    const renderer =
        new Elements.StylesSidebarPropertyRenderer.StylesSidebarPropertyRenderer('animation-name', 'foobar');
    renderer.setColorHandler(throwingHandler);
    renderer.setBezierHandler(throwingHandler);
    renderer.setFontHandler(throwingHandler);
    renderer.setShadowHandler(throwingHandler);
    renderer.setGridHandler(throwingHandler);
    renderer.setVarHandler(throwingHandler);
    renderer.setAngleHandler(throwingHandler);
    renderer.setLengthHandler(throwingHandler);

    const nodeContents = `NAME: ${name}`;
    renderer.setAnimationNameHandler(() => document.createTextNode(nodeContents));

    const node = renderer.renderValue();
    assert.deepEqual(node.textContent, nodeContents);
  });

  it('parses color-mix correctly', () => {
    const renderer = new Elements.StylesSidebarPropertyRenderer.StylesSidebarPropertyRenderer(
        'color', 'color-mix(in srgb, red, blue)');
    renderer.setColorMixHandler(() => document.createTextNode(nodeContents));

    const nodeContents = 'nodeContents';

    const node = renderer.renderValue();
    assert.deepEqual(node.textContent, nodeContents);
  });

  it('does not call bezier handler when color() value contains srgb-linear color space in a variable definition',
     () => {
       const colorHandler = sinon.fake.returns(document.createTextNode('colorHandler'));
       const bezierHandler = sinon.fake.returns(document.createTextNode('bezierHandler'));
       const renderer = new Elements.StylesSidebarPropertyRenderer.StylesSidebarPropertyRenderer(
           '--color', 'color(srgb-linear 1 0.55 0.72)');
       renderer.setColorHandler(colorHandler);
       renderer.setBezierHandler(bezierHandler);

       renderer.renderValue();

       assert.isTrue(colorHandler.called);
       assert.isFalse(bezierHandler.called);
     });

  it('runs animation handler for animation property', () => {
    const renderer =
        new Elements.StylesSidebarPropertyRenderer.StylesSidebarPropertyRenderer('animation', 'example 5s');
    renderer.setAnimationHandler(() => document.createTextNode(nodeContents));

    const nodeContents = 'nodeContents';

    const node = renderer.renderValue();
    assert.deepEqual(node.textContent, nodeContents);
  });

  it('runs positionFallbackHandler for position-fallback property', () => {
    const nodeContents = 'nodeContents';
    const renderer =
        new Elements.StylesSidebarPropertyRenderer.StylesSidebarPropertyRenderer('position-fallback', '--compass');
    renderer.setPositionFallbackHandler(() => document.createTextNode(nodeContents));

    const node = renderer.renderValue();

    assert.deepEqual(node.textContent, nodeContents);
  });
});
