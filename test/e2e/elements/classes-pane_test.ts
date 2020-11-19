// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {beforeEach, describe, it} from 'mocha';

import {goToResource, timeout} from '../../shared/helper.js';
import {assertSelectedNodeClasses, getContentOfSelectedNode, toggleClassesPane, toggleClassesPaneCheckbox, typeInClassesPaneInput} from '../helpers/elements-helpers.js';

describe('The Classes pane', async () => {
  beforeEach(async function() {
    await goToResource('elements/simple-styled-page.html');
    await toggleClassesPane();
  });

  it('can add a class to the element', async () => {
    await typeInClassesPaneInput('foo');
    await assertSelectedNodeClasses(['foo']);
  });

  it('can add multiple classes at once', async () => {
    await typeInClassesPaneInput('foo bar baz');
    await assertSelectedNodeClasses(['foo', 'bar', 'baz']);
  });

  it('can toggle classes', async () => {
    await typeInClassesPaneInput('on off');
    await assertSelectedNodeClasses(['on', 'off']);

    await toggleClassesPaneCheckbox('off');
    await assertSelectedNodeClasses(['on']);

    await toggleClassesPaneCheckbox('off');
    await toggleClassesPaneCheckbox('on');
    await assertSelectedNodeClasses(['off']);
  });

  // eslint-disable-next-line
  it.only('removes the previewed classes on ESC', async () => {
    const logClasses = async () => {
      const nodeText = await getContentOfSelectedNode();
      const match = nodeText.match(/class=\u200B"([^"]*)/);
      const classText = match ? match[1] : '';
      const classes = classText.split(/[\s]/).map(className => className.trim()).filter(className => className.length);
      // eslint-disable-next-line
      console.log(classes);
    };
    await timeout(1000);
    logClasses();
    await typeInClassesPaneInput('foo');
    await timeout(1000);
    logClasses();
    await typeInClassesPaneInput('bar', 'Escape', false);
    await timeout(1000);
    logClasses();
    await typeInClassesPaneInput('baz');
    await timeout(1000);
    logClasses();
    await assertSelectedNodeClasses(['foo', 'baz']);
  });
});
