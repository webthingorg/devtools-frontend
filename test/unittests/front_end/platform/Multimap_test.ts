// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Multimap} from '../../../../front_end/platform/platform.js';

const {assert} = chai;

describe('Multimap', () => {
  describe('get', () => {
    it('returns a set that is part of the MultiMap for existing keys', () => {
      const map = new Multimap<string, string>();
      map.set('key1', 'value1');

      const key1Values = map.get('key1');
      key1Values.add('value2');

      assert.deepStrictEqual([...map.get('key1')], ['value1', 'value2']);
    });

    it('returns a set that is part of the MultiMap for non-existing keys', () => {
      const map = new Multimap<string, string>();

      const key1Values = map.get('key1');
      key1Values.add('value1');
      key1Values.add('value2');

      assert.deepStrictEqual([...map.get('key1')], ['value1', 'value2']);
    });
  });
});
