// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {Step, ClickStep, StepWithFrameContext, ChangeStep, SubmitStep, Recording} from './Recording.js';

export class RecordingScriptWriter {
  private indentation: string;
  private recording: Recording;

  constructor(indentation: string, recording: Recording) {
    this.indentation = indentation;
    this.recording = recording;
  }

  getScript(): string {
    const indentation = this.indentation;
    const script: string[] = [];
    let currentIndentation = 0;

    function appendLineToScript(line: string): void {
      script.push(line ? indentation.repeat(currentIndentation) + line.trimRight() : '');
    }

    function appendTarget(target: string): void {
      if (target === 'main') {
        appendLineToScript('const targetPage = page;');
      } else {
        appendLineToScript(`const target = await browser.waitForTarget(t => t.url === ${JSON.stringify(target)});`);
        appendLineToScript('const targetPage = await target.page();');
      }
    }

    function appendFrame(path: number[]): void {
      appendLineToScript('let frame = targetPage.mainFrame();');
      for (const index of path) {
        appendLineToScript(`frame = frame.childFrames()[${index}]`);
      }
    }

    function appendContext(step: StepWithFrameContext): void {
      appendTarget(step.target);
      appendFrame(step.path);
    }

    function appendClickStep(step: ClickStep): void {
      appendContext(step);
      appendLineToScript(`const element = await frame.waitForSelector(${JSON.stringify(step.selector)});`);
      appendLineToScript('await element.click();');
    }

    function appendChangeStep(step: ChangeStep): void {
      appendContext(step);
      appendLineToScript(`const element = await frame.waitForSelector(${JSON.stringify(step.selector)});`);
      appendLineToScript(`await element.type(${JSON.stringify(step.value)});`);
    }

    function appendSubmitStep(step: SubmitStep): void {
      appendContext(step);
      appendLineToScript(`const element = await frame.waitForSelector(${JSON.stringify(step.selector)});`);
      appendLineToScript('await element.evaluate(form => form.submit());');
    }

    function appendStepType(step: Step): void {
      switch (step.type) {
        case 'click':
          return appendClickStep(step);
        case 'change':
          return appendChangeStep(step);
        case 'submit':
          return appendSubmitStep(step);
      }
    }


    function appendStep(step: Step): void {
      appendLineToScript('{');
      currentIndentation += 1;

      if ('condition' in step && step.condition === 'waitForNavigation') {
        appendLineToScript('const promise = targetPage.waitForNavigation();');
      }

      appendStepType(step);

      if ('condition' in step) {
        appendLineToScript('await promise;');
      }

      currentIndentation -= 1;
      appendLineToScript('}');
    }

    appendLineToScript('const puppeteer = require(\'puppeteer\');');
    appendLineToScript('');
    appendLineToScript('(async () => {');
    currentIndentation += 1;
    appendLineToScript('const browser = await puppeteer.launch();');
    appendLineToScript('const page = await browser.newPage();');
    appendLineToScript('');

    for (const section of this.recording.sections) {
      for (const step of section.steps) {
        appendStep(step);
      }
    }

    appendLineToScript('');
    appendLineToScript('await browser.close();');
    currentIndentation -= 1;
    appendLineToScript('})();');
    // Scripts should end with a final blank line.
    return script.join('\n') + '\n';
  }
}
