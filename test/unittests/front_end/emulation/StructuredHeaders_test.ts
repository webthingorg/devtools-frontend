// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as StructuredHeaders from '../../../../front_end/emulation/StructuredHeaders.js';

function assertItemError(result: StructuredHeaders.Item|StructuredHeaders.Error): void {
  assert.strictEqual(result.kind, StructuredHeaders.ResultKind.Error);
}

function assertItemInteger(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('Got error instead of integer');
    return;
  }
  const bareItem = result.value;
  if (bareItem.kind !== StructuredHeaders.ResultKind.Integer) {
    assert.fail('Item type is ' + StructuredHeaders.ResultKind[bareItem.kind] + ' instead of integer');
    return;
  }

  assert.strictEqual(bareItem.value, expected);
}

function assertItemDecimal(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('Got error instead of decimal');
    return;
  }
  const bareItem = result.value;
  if (bareItem.kind !== StructuredHeaders.ResultKind.Decimal) {
    assert.fail('Item type is ' + StructuredHeaders.ResultKind[bareItem.kind] + ' instead of decimal');
    return;
  }

  assert.strictEqual(bareItem.value, expected);
}

function assertItemBoolean(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: boolean): void {
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('Got error instead of boolean');
    return;
  }
  const bareItem = result.value;
  if (bareItem.kind !== StructuredHeaders.ResultKind.Boolean) {
    assert.fail('Item type is ' + StructuredHeaders.ResultKind[bareItem.kind] + ' instead of boolean');
    return;
  }

  assert.strictEqual(bareItem.value, expected);
}

describe('StructuredHeaders', () => {
  describe('parseItem', () => {
    it('Basic integer parsing', () => {
      assertItemInteger(StructuredHeaders.parseItem('23'), 23);
      assertItemInteger(StructuredHeaders.parseItem('023'), 23);
      assertItemInteger(StructuredHeaders.parseItem('-100'), -100);
      assertItemInteger(StructuredHeaders.parseItem('-0'), 0);
      assertItemInteger(StructuredHeaders.parseItem('-999999999999999'), -999999999999999);
      assertItemInteger(StructuredHeaders.parseItem('999999999999999'), 999999999999999);
      assertItemError(StructuredHeaders.parseItem('1999999999999999'));
      assertItemError(StructuredHeaders.parseItem('-1999999999999999'));
      assertItemError(StructuredHeaders.parseItem('-'));
      assertItemError(StructuredHeaders.parseItem('--1'));
    });
    it('Basic decimal parsing', () => {
      assertItemDecimal(StructuredHeaders.parseItem('23.4'), 23.4);
      assertItemDecimal(StructuredHeaders.parseItem('023.4'), 23.4);
      assertItemDecimal(StructuredHeaders.parseItem('-100.3'), -100.3);
      assertItemDecimal(StructuredHeaders.parseItem('-100.32'), -100.32);
      assertItemDecimal(StructuredHeaders.parseItem('100.325'), 100.325);
      assertItemDecimal(StructuredHeaders.parseItem('-0.0'), -0);
      assertItemDecimal(StructuredHeaders.parseItem('-999999999999.999'), -999999999999.999);
      assertItemDecimal(StructuredHeaders.parseItem('999999999999.999'), 999999999999.999);
      assertItemError(StructuredHeaders.parseItem('.'));
      assertItemError(StructuredHeaders.parseItem('1.'));
      assertItemError(StructuredHeaders.parseItem('1.0000'));
      assertItemError(StructuredHeaders.parseItem('--1.0'));
      assertItemError(StructuredHeaders.parseItem('1999999999999.9'));
    });
    it('Basic boolean parsing', () => {
      assertItemBoolean(StructuredHeaders.parseItem('?0'), false);
      assertItemBoolean(StructuredHeaders.parseItem('?1'), true);
      assertItemError(StructuredHeaders.parseItem('?01'));
      assertItemError(StructuredHeaders.parseItem('?2'));
      assertItemError(StructuredHeaders.parseItem('?'));
    });
  });
});
