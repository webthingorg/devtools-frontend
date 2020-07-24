// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface DOMNode {
  smth: string;
}

export type SettingType = 'boolean'|'enum';

export interface BaseSettingOption {
  label: string;
}

export interface BooleanSettingOption {
  value: boolean;
}

export interface EnumSettingOption {
  value: string;
}

export interface BaseSetting {
  settingName: string;
  settingType: SettingType;
}

export type BooleanSetting = BaseSetting&{settingType: 'boolean', options: BooleanSettingOption[], value: boolean};
export type EnumSetting = BaseSetting&{settingType: 'enum', options: EnumSettingOption[], value: string};
export type Setting = EnumSetting|BooleanSetting;
