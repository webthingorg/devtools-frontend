// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {isLocalizationCall, espree, getLocalizationCaseAndVersion, isLocalizationV2Call} =
    require('../localization_utils');
const {assert} = require('chai');

const parseCode = code => espree.parse(code, {ecmaVersion: 11, sourceType: 'module', range: true, loc: true});

describe('isLocalizationCall', () => {
  it('is true for a tagged template expression', () => {
    const ast = parseCode('ls`foo`');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to Common.UIString', () => {
    const ast = parseCode('Common.UIString(\'blahblah %s\', 2)');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to Common.UIString.UIString', () => {
    const ast = parseCode('Common.UIString.UIString(\'blahblah %s, 2\')');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to UIString', () => {
    const ast = parseCode('UIString(\'blahblah %s, 2\')');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to Platform.UIString.UIString', () => {
    const ast = parseCode('Platform.UIString.UIString(\'blahblah %s, 2\')');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to UI.formatLocalized', () => {
    const ast = parseCode('UI.formatLocalized(\'blahblah %s, 2\')');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });

  it('is true for a call to UI.UIUtils.formatLocalized', () => {
    const ast = parseCode('UI.UIUtils.formatLocalized(\'blahblah %s, 2\')');
    assert.isTrue(isLocalizationCall(ast.body[0].expression));
  });
});

describe('isLocalizationV2Call', () => {
  it('is true for a call to Common.i18n.getLocalizedString', () => {
    const ast = parseCode('Common.i18n.getLocalizedString(_str, UIStrings.fakeID)');
    assert.isTrue(isLocalizationV2Call(ast.body[0].expression));
  });

  it('is true for a call to Common.i18n.getFormatLocalizedString', () => {
    const ast = parseCode('Common.i18n.getFormatLocalizedString(_str, UIStrings.fakeID)');
    assert.isTrue(isLocalizationV2Call(ast.body[0].expression));
  });

  it('is true for a declaration of UIStrings', () => {
    const ast = parseCode('const UIStrings = {fakeID: "Hello World"}');
    assert.isTrue(isLocalizationV2Call(ast.body[0].declarations[0]));
  });

  it('is false for a tagged template expression', () => {
    const ast = parseCode('ls`foo`');
    assert.isFalse(isLocalizationV2Call(ast.body[0].expression));
  });
});

describe('getLocalizationCaseAndVersion', () => {
  it('returns [Tagged Template, 1] for a tagged template', () => {
    const ast = parseCode('ls`foo`');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Tagged Template', 1]);
  });

  it('returns [Common.UIString, 1] for Common.UIString', () => {
    const ast = parseCode('Common.UIString(\'blah\', 2)');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Common.UIString', 1]);
  });

  it('returns [Common.UIString, 1] for Common.UIString.UIString', () => {
    const ast = parseCode('Common.UIString(\'blah\', 2)');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Common.UIString', 1]);
  });

  it('returns [UI.formatLocalized, 1] for UI.formatLocalized', () => {
    const ast = parseCode('UI.formatLocalized(\'blahblah %s, 2\')');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['UI.formatLocalized', 1]);
  });

  it('returns [Platform.UIString, 1] for Platform.UIString.UIString', () => {
    const ast = parseCode('Platform.UIString.UIString(\'blahblah %s, 2\')');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Platform.UIString', 1]);
  });

  it('returns [Platform.UIString, 1] for UIString', () => {
    const ast = parseCode('UIString(\'blahblah %s, 2\')');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Platform.UIString', 1]);
  });
  it('returns [Common.i18n.getLocalizedString, 2] for Common.i18n.getLocalizedString', () => {
    const ast = parseCode('Common.i18n.getLocalizedString(_str, UIStrings.fakeID)');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].expression), ['Common.i18n.getLocalizedString', 2]);
  });
  it('returns [Common.i18n.getFormatLocalizedString, 2] for Common.i18n.getFormatLocalizedString', () => {
    const ast = parseCode('Common.i18n.getFormatLocalizedString(_str, UIStrings.fakeID)');
    assert.deepEqual(
        getLocalizationCaseAndVersion(ast.body[0].expression), ['Common.i18n.getFormatLocalizedString', 2]);
  });
  it('returns [UIStrings, 2] for UIStrings', () => {
    const ast = parseCode('const UIStrings = {fakeID: "Hello World"}');
    assert.deepEqual(getLocalizationCaseAndVersion(ast.body[0].declarations[0]), ['UIStrings', 2]);
  });
});
