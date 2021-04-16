// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface ClickStep {
  type: 'click';
  selector: string;
}

export type Step = ClickStep;

export interface RecordingSection {
  screenshot: string;
  title: string;
  url: string;
  steps: Step[];
}

export interface Recording {
  title: string;
  description: string | null;
  sections: RecordingSection[];
}
