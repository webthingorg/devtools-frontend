// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as StructuredHeaders from '../../../../front_end/emulation/StructuredHeaders.js';

function assertItemError(result: StructuredHeaders.Item|StructuredHeaders.Error): void {
  assert.strictEqual(result.kind, StructuredHeaders.ResultKind.Error);
}

function assertItemValue(
    result: StructuredHeaders.Item|StructuredHeaders.Error, expectedKind: StructuredHeaders.ResultKind,
    expected: string|number|boolean): void {
  const expectedKindName: string = StructuredHeaders.ResultKind[expectedKind];
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('Got error instead of Item containing ' + expectedKindName);
    return;
  }
  const bareItem = result.value;
  if (bareItem.kind !== expectedKind) {
    assert.fail('Item type is ' + StructuredHeaders.ResultKind[bareItem.kind] + ' instead of ' + expectedKindName);
    return;
  }

  assert.strictEqual(bareItem.value, expected);
}

function assertItemInteger(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  assertItemValue(result, StructuredHeaders.ResultKind.Integer, expected);
}

function assertItemDecimal(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  assertItemValue(result, StructuredHeaders.ResultKind.Decimal, expected);
}

function assertItemString(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.String, expected);
}

function assertItemToken(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.Token, expected);
}

function assertItemBinary(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.Binary, expected);
}

function assertItemBoolean(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: boolean): void {
  assertItemValue(result, StructuredHeaders.ResultKind.Boolean, expected);
}

function assertListError(result: StructuredHeaders.List|StructuredHeaders.Error): void {
  assert.strictEqual(result.kind, StructuredHeaders.ResultKind.Error);
}

function assertListAndGetItems(result: StructuredHeaders.List|StructuredHeaders.Error): StructuredHeaders.ListMember[] {
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('Got error instead of List');
    return [];
  }
  return result.items;
}

function assertListItem(
    item: StructuredHeaders.ListMember, expectValue: StructuredHeaders.BareItem,
    expectParams: [string, StructuredHeaders.BareItem][]): void {
  if (item.kind === StructuredHeaders.ResultKind.InnerList) {
    assert.fail('Unexpected inner list when an item expected');
    return;
  }
  assert(
      bareItemEquals(item.value, expectValue),
      'List item bare value mismatch, ' + item.value.value + ' vs expected ' + expectValue.value);
  assertItemParams(item, expectParams);
}

function assertInnerListAndGetItems(
    item: StructuredHeaders.ListMember,
    expectParams: [string, StructuredHeaders.BareItem][]): StructuredHeaders.Item[] {
  if (item.kind !== StructuredHeaders.ResultKind.InnerList) {
    assert.fail('Expected inner list, got:' + StructuredHeaders.ResultKind[item.kind]);
    return [];
  }
  assertParams(item.parameters, expectParams);
  return item.items;
}

function bareItemEquals(l: StructuredHeaders.BareItem, r: StructuredHeaders.BareItem): boolean {
  switch (l.kind) {
    case StructuredHeaders.ResultKind.Integer:
      return r.kind === StructuredHeaders.ResultKind.Integer && l.value === r.value;
    case StructuredHeaders.ResultKind.Decimal:
      return r.kind === StructuredHeaders.ResultKind.Decimal && l.value === r.value;
    case StructuredHeaders.ResultKind.String:
      return r.kind === StructuredHeaders.ResultKind.String && l.value === r.value;
    case StructuredHeaders.ResultKind.Token:
      return r.kind === StructuredHeaders.ResultKind.Token && l.value === r.value;
    case StructuredHeaders.ResultKind.Binary:
      return r.kind === StructuredHeaders.ResultKind.Binary && l.value === r.value;
    case StructuredHeaders.ResultKind.Boolean:
      return r.kind === StructuredHeaders.ResultKind.Boolean && l.value === r.value;
  }
}

function assertParams(
    result: StructuredHeaders.Parameters, expectParams: [string, StructuredHeaders.BareItem][]): void {
  assert.lengthOf(result.items, expectParams.length);
  for (let i = 0; i < expectParams.length; ++i) {
    assert.strictEqual(result.items[i].name.value, expectParams[i][0]);
    assert(bareItemEquals(result.items[i].value, expectParams[i][1]), 'Param ' + i + ' value matches');
  }
}

function assertItemParams(
    result: StructuredHeaders.Item|StructuredHeaders.Error,
    expectParams: [string, StructuredHeaders.BareItem][]): void {
  if (result.kind === StructuredHeaders.ResultKind.Error) {
    assert.fail('No params on parse error');
    return;
  }
  assertParams(result.parameters, expectParams);
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
    it('Basic string parsing', () => {
      assertItemString(StructuredHeaders.parseItem('"abcd"'), 'abcd');
      assertItemString(StructuredHeaders.parseItem('"a\\"\\\\"'), 'a"\\');
      assertItemError(StructuredHeaders.parseItem('"\\n"'));
      assertItemError(StructuredHeaders.parseItem('"\\"'));
      assertItemError(StructuredHeaders.parseItem('"foo'));
      assertItemError(StructuredHeaders.parseItem('"'));
    });
    it('Basic token parsing', () => {
      assertItemToken(StructuredHeaders.parseItem('abcd'), 'abcd');
      assertItemToken(StructuredHeaders.parseItem('*'), '*');
      assertItemToken(StructuredHeaders.parseItem('*z/foo:bar'), '*z/foo:bar');
      assertItemError(StructuredHeaders.parseItem('/far'));
    });
    it('Basic binary parsing', () => {
      assertItemBinary(StructuredHeaders.parseItem(':aBcd+/ef0=:'), 'aBcd+/ef0=');
      assertItemError(StructuredHeaders.parseItem(':foo'));
      assertItemError(StructuredHeaders.parseItem(':'));
    });
    it('Basic boolean parsing', () => {
      assertItemBoolean(StructuredHeaders.parseItem('?0'), false);
      assertItemBoolean(StructuredHeaders.parseItem('?1'), true);
      assertItemError(StructuredHeaders.parseItem('?01'));
      assertItemError(StructuredHeaders.parseItem('?2'));
      assertItemError(StructuredHeaders.parseItem('?'));
    });
    it('Parameter parsing', () => {
      const r1 = StructuredHeaders.parseItem('token; a=1; b=?0');
      assertItemToken(r1, 'token');
      assertItemParams(r1, [
        ['a', {kind: StructuredHeaders.ResultKind.Integer, value: 1}],
        ['b', {kind: StructuredHeaders.ResultKind.Boolean, value: false}],
      ]);

      const r2 = StructuredHeaders.parseItem('toooken; a=1; b=?0; a=2; c=4.2; b=?1; a=4; b="hi"');
      assertItemToken(r2, 'toooken');
      assertItemParams(r2, [
        ['c', {kind: StructuredHeaders.ResultKind.Decimal, value: 4.2}],
        ['a', {kind: StructuredHeaders.ResultKind.Integer, value: 4}],
        ['b', {kind: StructuredHeaders.ResultKind.String, value: 'hi'}],
      ]);

      const r3 = StructuredHeaders.parseItem('token; a; b=?0');
      assertItemToken(r3, 'token');
      assertItemParams(r3, [
        ['a', {kind: StructuredHeaders.ResultKind.Boolean, value: true}],
        ['b', {kind: StructuredHeaders.ResultKind.Boolean, value: false}],
      ]);

      const r4 = StructuredHeaders.parseItem('token; *a123-456.789_0*');
      assertItemToken(r4, 'token');
      assertItemParams(r4, [
        ['*a123-456.789_0*', {kind: StructuredHeaders.ResultKind.Boolean, value: true}],
      ]);

      assertItemError(StructuredHeaders.parseItem('token; A=1'));
      assertItemError(StructuredHeaders.parseItem('token; aA=1'));
      assertItemError(StructuredHeaders.parseItem('token ;a=1'));
      assertItemError(StructuredHeaders.parseItem('token; a=1;'));
    });
    it('List parsing', () => {
      const i1 = assertListAndGetItems(StructuredHeaders.parseList('a, \t"b", ?0;d;e=42'));
      assert.lengthOf(i1, 3);
      assertListItem(i1[0], {kind: StructuredHeaders.ResultKind.Token, value: 'a'}, []);
      assertListItem(i1[1], {kind: StructuredHeaders.ResultKind.String, value: 'b'}, []);
      assertListItem(i1[2], {kind: StructuredHeaders.ResultKind.Boolean, value: false}, [
        ['d', {kind: StructuredHeaders.ResultKind.Boolean, value: true}],
        ['e', {kind: StructuredHeaders.ResultKind.Integer, value: 42}],
      ]);

      // Grammar seems to reject it, but the algorithm (which is normative) seems OK
      // with it, and 0-length lists are OK per the data model.
      const i2 = assertListAndGetItems(StructuredHeaders.parseList(''));
      assert.lengthOf(i2, 0);

      const i3 = assertListAndGetItems(StructuredHeaders.parseList('a, ("b" "c"), (d e)'));
      assert.lengthOf(i3, 3);
      assertListItem(i3[0], {kind: StructuredHeaders.ResultKind.Token, value: 'a'}, []);
      const i3_l1 = assertInnerListAndGetItems(i3[1], []);
      assert.lengthOf(i3_l1, 2);
      assertListItem(i3_l1[0], {kind: StructuredHeaders.ResultKind.String, value: 'b'}, []);
      assertListItem(i3_l1[1], {kind: StructuredHeaders.ResultKind.String, value: 'c'}, []);
      const i3_l2 = assertInnerListAndGetItems(i3[2], []);
      assert.lengthOf(i3_l2, 2);
      assertListItem(i3_l2[0], {kind: StructuredHeaders.ResultKind.Token, value: 'd'}, []);
      assertListItem(i3_l2[1], {kind: StructuredHeaders.ResultKind.Token, value: 'e'}, []);

      // Empty inner lists are OK.
      const i4 = assertListAndGetItems(StructuredHeaders.parseList(' (  )  '));
      assert.lengthOf(i4, 1);
      const i4_l0 = assertInnerListAndGetItems(i4[0], []);
      assert.lengthOf(i4_l0, 0);

      // Example from spec, with inner list params and item params.
      const i5 = assertListAndGetItems(StructuredHeaders.parseList('("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1'));
      assert.lengthOf(i5, 2);
      const i5_l0 =
          assertInnerListAndGetItems(i5[0], [['lvl', {kind: StructuredHeaders.ResultKind.Integer, value: 5}]]);
      assert.lengthOf(i5_l0, 1);
      assertListItem(i5_l0[0], {kind: StructuredHeaders.ResultKind.String, value: 'foo'}, [
        ['a', {kind: StructuredHeaders.ResultKind.Integer, value: 1}],
        ['b', {kind: StructuredHeaders.ResultKind.Integer, value: 2}],
      ]);
      const i5_l1 =
          assertInnerListAndGetItems(i5[1], [['lvl', {kind: StructuredHeaders.ResultKind.Integer, value: 1}]]);
      assert.lengthOf(i5_l1, 2);
      assertListItem(i5_l1[0], {kind: StructuredHeaders.ResultKind.String, value: 'bar'}, []);
      assertListItem(i5_l1[1], {kind: StructuredHeaders.ResultKind.String, value: 'baz'}, []);

      assertListError(StructuredHeaders.parseList('a,'));
      assertListError(StructuredHeaders.parseList('a b'));
      assertListError(StructuredHeaders.parseList('(a,'));
      assertListError(StructuredHeaders.parseList('(a,b'));
    });
  });
});
