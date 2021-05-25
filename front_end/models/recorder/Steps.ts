// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// eslint-disable-next-line @typescript-eslint/naming-convention
export type Selector = string&{__brand: 'selector'};

export interface WaitForNavigationCondition {
  type: 'waitForNavigation';
  expectedUrl: string;
}

export type Condition = WaitForNavigationCondition;


export interface FrameContext {
  path: number[];
  target: string;
}

export interface StepWithFrameContext {
  context: FrameContext;
}

export interface ClickStep extends StepWithFrameContext, StepWithCondition {
  type: 'click';
  selector: Selector;
}

export interface NetworkConditions {
  download: number;
  upload: number;
  latency: number;
}

export interface EmulateNetworkConditionsStep {
  type: 'emulateNetworkConditions';
  conditions: NetworkConditions;
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

export interface StepWithCondition {
  condition?: Condition;
}

export type Step = ClickStep|ChangeStep|SubmitStep|EmulateNetworkConditionsStep;

export interface UserFlowSection {
  screenshot: string;
  title: string;
  url: string;
  steps: Step[];
}

export interface UserFlow {
  title: string;
  description?: string;
  sections: UserFlowSection[];
}

export function assertAllStepTypesAreHandled(s: never): never;
export function assertAllStepTypesAreHandled(s: Step): never {
  throw new Error(`Unknown step type: ${s.type}`);
}


export function createClickStep(context: FrameContext, selector: Selector): ClickStep {
  return {
    type: 'click',
    context,
    selector,
  };
}

export function createSubmitStep(context: FrameContext, selector: Selector): SubmitStep {
  return {
    type: 'submit',
    context,
    selector,
  };
}

export function createChangeStep(context: FrameContext, selector: Selector, value: string): ChangeStep {
  return {
    type: 'change',
    context,
    selector,
    value,
  };
}

export function createEmulateNetworkConditionsStep(conditions: NetworkConditions): EmulateNetworkConditionsStep {
  return {
    type: 'emulateNetworkConditions',
    conditions,
  };
}
