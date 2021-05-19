// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Selector = string&{__brand: 'selector'};

export interface StepWithFrameContext {
  path: number[];
  target: string;
}

export interface ClickStep extends StepWithFrameContext, StepWithCondition {
  type: 'click';
  selector: Selector;
}

export interface EmulateNetworkConditionsStep {
  type: 'emulateNetworkConditions';
  conditions: SDK.NetworkManager.Conditions;
}

export interface ChangeStep extends StepWithFrameContext, StepWithCondition {
  type: 'change';
  selector: Selector;
  value: string;
}

export interface SubmitStep extends StepWithFrameContext, StepWithCondition {
  type: 'submit';
  selector: Selector;
}

export type Condition = 'waitForNavigation';

export interface StepWithCondition {
  condition?: Condition;
}

export type Step = ClickStep|ChangeStep|SubmitStep|EmulateNetworkConditionsStep;

export interface RecordingSection {
  screenshot: string;
  title: string;
  url: string;
  steps: Step[];
}

export interface Recording {
  title: string;
  description?: string;
  sections: RecordingSection[];
}
