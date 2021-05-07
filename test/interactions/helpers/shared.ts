// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages, getTestServerPort} from '../../shared/helper.js';

export const loadComponentDocExample = async (url: string, {prepend}: {prepend: string} = {
  prepend: '',
}) => {
  const {frontend} = getBrowserAndPages();
  await frontend.goto(`http://localhost:${getTestServerPort()}/${prepend}front_end/ui/components/docs/${url}`, {
    waitUntil: 'networkidle0',
  });
};

export const preloadForCodeCoverage = (name: string) => {
  before(async function() {
    this.timeout(0);
    await loadComponentDocExample(name, {prepend: 'compute-coverage/'});
  });
};
