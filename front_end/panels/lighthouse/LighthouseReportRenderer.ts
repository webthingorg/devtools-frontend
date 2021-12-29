// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as LighthouseReport from '../../third_party/lighthouse/report/report.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import * as Timeline from '../timeline/timeline.js';
import type {RunnerResultArtifacts, NodeDetailsJSON, SourceLocationDetailsJSON, ReportJSON} from './LighthouseReporterTypes.js';

const UIStrings = {
  /**
  *@description Label for view trace button when simulated throttling is enabled
  */
  viewOriginalTrace: 'View Original Trace',
  /**
  *@description Text of the timeline button in Lighthouse Report Renderer
  */
  viewTrace: 'View Trace',
  /**
  *@description Help text for 'View Trace' button
  */
  thePerformanceMetricsAboveAre:
      'The performance metrics above are simulated and won\'t match the timings found in this trace. Disable simulated throttling in "Lighthouse Settings" if you want the timings to match.',
};
const str_ = i18n.i18n.registerUIStrings('panels/lighthouse/LighthouseReportRenderer.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const MaxLengthForLinks = 40;

async function waitForMainTargetLoad(): Promise<void> {
  const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
  if (!mainTarget) {
    return;
  }
  const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
  if (!resourceTreeModel) {
    return;
  }
  await resourceTreeModel.once(SDK.ResourceTreeModel.Events.Load);
}

export class LighthouseReportRenderer {
  constructor(private lhr: ReportJSON, private artifacts: RunnerResultArtifacts|undefined,
    private beforePrint: () => void, private afterPrint: () => void) {
  }

  render(): HTMLElement {
    const el = LighthouseReport.renderReport(this.lhr, {
      getStandaloneReportHTML: () => {
        // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
        return Lighthouse.ReportGenerator.generateReportHtml(this.lhr);
      },
      onSaveFileOverride: this.saveFile.bind(this),
      onPrintOverride: this.print.bind(this),
    });
    el.classList.add('lh-devtools');

    // Linkifying requires the target be loaded. Do not block the report
    // from rendering, as this is just an embellishment and the main target
    // could take awhile to load.
    waitForMainTargetLoad().then(() => {
      this.linkifyNodeDetails(el);
      this.linkifySourceLocationDetails(el);
    });
    this.handleDarkMode(el);
    this.addViewTraceButton(el);

    return el;
  }

  private addViewTraceButton(el: HTMLElement): void {
    if (!this.artifacts || !this.artifacts.traces || !this.artifacts.traces.defaultPass) {
      return;
    }

    const simulated = this.artifacts.settings.throttlingMethod === 'simulate';
    const container = el.querySelector('.lh-audit-group');
    if (!container) {
      return;
    }

    const defaultPassTrace = this.artifacts.traces.defaultPass;
    const text = simulated ? i18nString(UIStrings.viewOriginalTrace) : i18nString(UIStrings.viewTrace);
    const timelineButton = LighthouseReport.addButton(el, {
      text,
      onClick: onViewTraceClick,
    });
    if (timelineButton) {
      timelineButton.classList.add('lh-button--trace');
      if (simulated) {
        UI.Tooltip.Tooltip.install(timelineButton, i18nString(UIStrings.thePerformanceMetricsAboveAre));
      }
    }

    async function onViewTraceClick(): Promise<void> {
      Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseViewTrace);
      await UI.InspectorView.InspectorView.instance().showPanel('timeline');
      Timeline.TimelinePanel.TimelinePanel.instance().loadFromEvents(defaultPassTrace.traceEvents);
    }
  }

  private async linkifyNodeDetails(el: HTMLElement): Promise<void> {
    const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
    if (!mainTarget) {
      return;
    }
    const domModel = mainTarget.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return;
    }

    for (const origElement of el.getElementsByClassName('lh-node')) {
      const origHTMLElement = origElement as HTMLElement;
      const detailsItem = origHTMLElement.dataset as unknown as NodeDetailsJSON;
      if (!detailsItem.path) {
        continue;
      }

      const nodeId = await domModel.pushNodeByPathToFrontend(detailsItem.path);

      if (!nodeId) {
        continue;
      }
      const node = domModel.nodeForId(nodeId);
      if (!node) {
        continue;
      }

      const element = await Common.Linkifier.Linkifier.linkify(
          node, {tooltip: detailsItem.snippet, preventKeyboardFocus: undefined});
      UI.Tooltip.Tooltip.install(origHTMLElement, '');

      const screenshotElement = origHTMLElement.querySelector('.lh-element-screenshot');
      origHTMLElement.textContent = '';
      if (screenshotElement) {
        origHTMLElement.append(screenshotElement);
      }
      origHTMLElement.appendChild(element);
    }
  }

  private async linkifySourceLocationDetails(el: HTMLElement): Promise<void> {
    for (const origElement of el.getElementsByClassName('lh-source-location')) {
      const origHTMLElement = origElement as HTMLElement;
      const detailsItem = origHTMLElement.dataset as SourceLocationDetailsJSON;
      if (!detailsItem.sourceUrl || !detailsItem.sourceLine || !detailsItem.sourceColumn) {
        continue;
      }
      const url = detailsItem.sourceUrl;
      const line = Number(detailsItem.sourceLine);
      const column = Number(detailsItem.sourceColumn);
      const element = await Components.Linkifier.Linkifier.linkifyURL(url, {
        lineNumber: line,
        columnNumber: column,
        showColumnNumber: false,
        inlineFrameIndex: 0,
        maxLength: MaxLengthForLinks,
        bypassURLTrimming: undefined,
        className: undefined,
        preventClick: undefined,
        tabStop: undefined,
        text: undefined,
      });
      UI.Tooltip.Tooltip.install(origHTMLElement, '');
      origHTMLElement.textContent = '';
      origHTMLElement.appendChild(element);
    }
  }

  private handleDarkMode(el: HTMLElement): void {
    if (ThemeSupport.ThemeSupport.instance().themeName() === 'dark') {
      el.classList.add('lh-dark');
    }
  }

  private async saveFile(blob: Blob|File, filename: string): Promise<void> {
    const text = await blob.text();
    Workspace.FileManager.FileManager.instance().save(filename, text, true /* forceSaveAs */);
  }

  private async print(rootEl: HTMLElement): Promise<void> {
    const clonedReport = rootEl.cloneNode(true);
    const printWindow = window.open('', '_blank', 'channelmode=1,status=1,resizable=1');
    if (!printWindow) {
      return;
    }

    printWindow.document.body.replaceWith(clonedReport);
    // Linkified nodes are shadow elements, which aren't exposed via `cloneNode`.
    await this.linkifyNodeDetails(clonedReport as HTMLElement);

    this.beforePrint();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    this.afterPrint();
  }
}
