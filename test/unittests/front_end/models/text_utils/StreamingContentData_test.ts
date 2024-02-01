// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TextUtils from '../../../../../front_end/models/text_utils/text_utils.js';

describe('StreamingContentData', () => {
  it('notifies listeners when new chunks are added', () => {
    const streamingContentData =
        TextUtils.StreamingContentData.StreamingContentData.createStreaming('text/plain', 'utf-8');
    const events: {content: TextUtils.StreamingContentData.StreamingContentData, chunk: string}[] = [];
    streamingContentData.addEventListener(
        TextUtils.StreamingContentData.Events.ChunkAdded, ({data}) => events.push(data));

    streamingContentData.addChunk('Zm9v');
    assert.lengthOf(events, 1);
    assert.strictEqual(events[0].content, streamingContentData);
    assert.strictEqual(events[0].chunk, 'Zm9v');

    streamingContentData.addChunk('YmFy');
    assert.lengthOf(events, 2);
    assert.strictEqual(events[1].content, streamingContentData);
    assert.strictEqual(events[1].chunk, 'YmFy');
  });

  it('provides a ContentData of all the received content so far', () => {
    const streamingContentData =
        TextUtils.StreamingContentData.StreamingContentData.createStreaming('text/plain', 'utf-8');
    streamingContentData.addChunk('Zm9v');
    streamingContentData.addChunk('YmFy');

    const contentData = streamingContentData.content();
    assert.strictEqual(contentData.text, 'foobar');
  });

  it('provides the same content when calling "content" repeatedly (checks caching)', () => {
    const streamingContentData =
        TextUtils.StreamingContentData.StreamingContentData.createStreaming('text/plain', 'utf-8');
    streamingContentData.addChunk('Zm9v');
    streamingContentData.addChunk('YmFy');

    const contentData1 = streamingContentData.content();
    assert.strictEqual(contentData1.text, 'foobar');

    const contentData2 = streamingContentData.content();
    assert.strictEqual(contentData2.text, 'foobar');
  });

  it('leaves previously returned ContentData alone after receiving a new chunk', () => {
    const streamingContentData =
        TextUtils.StreamingContentData.StreamingContentData.createStreaming('text/plain', 'utf-8');
    streamingContentData.addChunk('Zm9v');

    const contentData1 = streamingContentData.content();
    assert.strictEqual(contentData1.text, 'foo');

    streamingContentData.addChunk('YmFy');

    assert.strictEqual(contentData1.text, 'foo');
    const contentData2 = streamingContentData.content();
    assert.strictEqual(contentData2.text, 'foobar');
  });

  it('throws an error when calling addChunk on completed StreamingContentData', () => {
    const completeContentData = TextUtils.StreamingContentData.StreamingContentData.createComplete(
        new TextUtils.ContentData.ContentData('Zm9v', true, 'text/plain'));

    assert.throws((() => completeContentData.addChunk('YmFy')));
  });

  it('returns the provided content for a completed StreamingContentData', () => {
    const completeContentData = TextUtils.StreamingContentData.StreamingContentData.createComplete(
        new TextUtils.ContentData.ContentData('Zm9v', true, 'text/plain'));

    assert.strictEqual(completeContentData.content().text, 'foo');
  });
});
