// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const { assert } = chai;

import { Issue } from '/front_end/sdk/Issue.js';

describe('Issue', () => {
    after(() => {
        // FIXME(https://crbug.com/1006759): Remove after ESM work is complete
        delete (self as any).SDK;
    });

    it('should always require a code', () => {
        const issue = Issue.create('code');
        assert.equal(issue.code, 'code');
    });

    it('should default to have no affected resources', () => {
        const issue = Issue.create('code');
        assert.isEmpty(issue.resources);
    });

    it('should allow initialization with resources', () => {
        const issue = Issue.create('code', ['test']);
        assert.deepEqual(issue.resources, ['test']);
    });

    it('should allow adding of resources', () => {
        const issue = Issue.create('code');
        issue.addResources(['test']);
        assert.deepEqual(issue.resources, ['test']);
    });

    it('should make sure that a single resource is only ever added once', () => {
        const issue = Issue.create('code');
        issue.addResources(['test']);
        issue.addResources(['test']);
        assert.deepEqual(issue.resources, ['test']);
    });

    it('should trigger an updated event whenever a new resource gets added', () => {
        let hasBeenCalled = 0;
        const issue = Issue.create('code');
        issue.addEventListener(Issue.Events.Updated, () => { hasBeenCalled++; });
        issue.addResources(['test']);
        assert.equal(hasBeenCalled, 1, 'callback should have been called once');
    });

    it('should not trigger an updated event whenever a resource was already present', () => {
        let hasBeenCalled = 0;
        const issue = Issue.create('code');
        issue.addEventListener(Issue.Events.Updated, () => { hasBeenCalled++; });
        issue.addResources(['test']);
        issue.addResources(['test']);
        assert.equal(hasBeenCalled, 1, 'callback should have been called once');
    });

    it('should only trigger one update even when multiple resources have been added', () => {
        let hasBeenCalled = 0;
        const issue = Issue.create('code');
        issue.addEventListener(Issue.Events.Updated, () => { hasBeenCalled++; });
        issue.addResources(['test1', 'test2']);
        assert.equal(hasBeenCalled, 1, 'callback should have been called once');
    });
});
