// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import type * as TraceEngine from '../../../models/trace/trace.js';
import * as Dialogs from '../../../ui/components/dialogs/dialogs.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as Menus from '../../../ui/components/menus/menus.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';

import sidebarStyles from './sidebar.css.js';
import * as SidebarAnnotationsTab from './SidebarAnnotationsTab.js';
import * as SidebarInsight from './SidebarInsight.js';
import {SidebarSingleNavigation, type SidebarSingleNavigationData} from './SidebarSingleNavigation.js';

const DEFAULT_EXPANDED_WIDTH = 240;

export const enum SidebarTabsName {
  INSIGHTS = 'Insights',
  ANNOTATIONS = 'Annotations',
}
export const DEFAULT_SIDEBAR_TAB = SidebarTabsName.INSIGHTS;

export enum InsightsCategories {
  ALL = 'All',
  INP = 'INP',
  LCP = 'LCP',
  CLS = 'CLS',
  OTHER = 'Other',
}

export class ToggleSidebarInsights extends Event {
  static readonly eventName = 'toggleinsightclick';

  constructor() {
    super(ToggleSidebarInsights.eventName, {bubbles: true, composed: true});
  }
}

export const enum WidgetEvents {
  SidebarCollapseClick = 'SidebarCollapseClick',
}

export type WidgetEventTypes = {
  [WidgetEvents.SidebarCollapseClick]: {},
};

export class SidebarWidget extends Common.ObjectWrapper.eventMixin<WidgetEventTypes, typeof UI.SplitWidget.SplitWidget>(
    UI.SplitWidget.SplitWidget) {
  #sidebarUI = new SidebarUI();

  constructor() {
    super(true /* isVertical */, false /* secondIsSidebar */, undefined /* settingName */, DEFAULT_EXPANDED_WIDTH);

    this.sidebarElement().append(this.#sidebarUI);

    this.#sidebarUI.addEventListener('closebuttonclick', () => {
      this.dispatchEventToListeners(
          WidgetEvents.SidebarCollapseClick,
          {},
      );
    });
  }

  updateContentsOnExpand(): void {
    this.#sidebarUI.onWidgetShow();
  }

  setAnnotationsTabContent(updatedAnnotations: TraceEngine.Types.File.Annotation[]): void {
    this.#sidebarUI.annotations = updatedAnnotations;
  }

  setTraceParsedData(traceParsedData: TraceEngine.Handlers.Types.TraceParseData|null): void {
    this.#sidebarUI.traceParsedData = traceParsedData;
  }

  set data(insights: TraceEngine.Insights.Types.TraceInsightData) {
    this.#sidebarUI.insights = insights;
  }
}

export class SidebarUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #activeTab: SidebarTabsName = DEFAULT_SIDEBAR_TAB;
  selectedCategory: InsightsCategories = InsightsCategories.ALL;
  #lcpPhasesExpanded: boolean = false;

  #traceParsedData?: TraceEngine.Handlers.Types.TraceParseData|null;
  #phaseData: Array<{phase: string, timing: number|TraceEngine.Types.Timing.MilliSeconds, percent: string}> = [];
  #insights: TraceEngine.Insights.Types.TraceInsightData|null = null;
  #annotations: TraceEngine.Types.File.Annotation[] = [];

  #renderBound = this.#render.bind(this);

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  onWidgetShow(): void {
    // Called when the SidebarWidget is expanded in order to render. Because
    // this happens distinctly from any data being passed in, we need to expose
    // a method to allow the widget to let us know when to render. This also
    // matters because this is when we can update the underline below the
    // active tab, now that the sidebar is visible and has width.
    this.#render();
  }

  set annotations(annotations: TraceEngine.Types.File.Annotation[]) {
    this.#annotations = annotations;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  set insights(insights: TraceEngine.Insights.Types.TraceInsightData) {
    if (insights === this.#insights) {
      return;
    }
    this.#insights = insights;
    this.#phaseData = SidebarInsight.getLCPInsightData(this.#insights);
    // Reset toggled insights.
    this.#lcpPhasesExpanded = false;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  set traceParsedData(traceParsedData: TraceEngine.Handlers.Types.TraceParseData|null) {
    if (this.#traceParsedData === traceParsedData) {
      // If this is the same trace, do not re-render.
      return;
    }
    this.#traceParsedData = traceParsedData;

    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  #closeButtonClick(): void {
    this.dispatchEvent(new Event('closebuttonclick'));
  }

  #onTabHeaderClicked(activeTab: SidebarTabsName): void {
    if (activeTab === this.#activeTab) {
      return;
    }
    this.#activeTab = activeTab;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  #renderHeader(): LitHtml.LitTemplate {
    // clang-format off
    return LitHtml.html`
      <div class="tabs-header">
        <input
          type="button"
          value=${SidebarTabsName.INSIGHTS}
          ?active=${this.#activeTab === SidebarTabsName.INSIGHTS}
          @click=${()=>this.#onTabHeaderClicked(SidebarTabsName.INSIGHTS)}>
        <input
          type="button"
          value=${SidebarTabsName.ANNOTATIONS}
          ?active=${this.#activeTab === SidebarTabsName.ANNOTATIONS}
          @click=${()=>this.#onTabHeaderClicked(SidebarTabsName.ANNOTATIONS)}>
      </div>
    `;
    // clang-format on
  }

  #onTargetSelected(event: Menus.SelectMenu.SelectMenuItemSelectedEvent): void {
    this.selectedCategory = event.itemValue as InsightsCategories;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  #toggleLCPPhaseClick(): void {
    this.#lcpPhasesExpanded = !this.#lcpPhasesExpanded;
    this.dispatchEvent(new ToggleSidebarInsights());
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#renderBound);
  }

  #renderInsightsForCategory(insightsCategory: InsightsCategories): LitHtml.TemplateResult {
    // TODO: this will render the metrics for each navigation, but we need to
    // update the Insights to render them per-navigation and move them into the
    // SidebarSingleNavigation component.
    const navigations = this.#traceParsedData?.Meta.mainFrameNavigations ?? [];

    // clang-format off
    return LitHtml.html`
      ${navigations.map(navigation => {
        if (!navigation.args.data?.navigationId) {
          return LitHtml.nothing;
        }
        const data = {
          traceParsedData: this.#traceParsedData ?? null,
          insights: this.#insights,
          activeTab: this.#activeTab,
          navigationId: navigation.args.data.navigationId,
          activeCategory: insightsCategory,
        };

        return LitHtml.html`
          <${SidebarSingleNavigation.litTagName} .data=${data as SidebarSingleNavigationData}>
          </${SidebarSingleNavigation.litTagName}>
        `;
      })}

      ${insightsCategory === InsightsCategories.ALL || insightsCategory === InsightsCategories.LCP ?
        LitHtml.html`<div class="insights" @click=${this.#toggleLCPPhaseClick}>${
            SidebarInsight.renderLCPPhases(this.#phaseData, this.#lcpPhasesExpanded)
        }</div>` : LitHtml.nothing
      }
    `;
    // clang-format on
  }

  #renderInsightsTabContent(): LitHtml.TemplateResult {
    // clang-format off
    return LitHtml.html`
      <${Menus.SelectMenu.SelectMenu.litTagName}
            class="target-select-menu"
            @selectmenuselected=${this.#onTargetSelected}
            .showDivider=${true}
            .showArrow=${true}
            .sideButton=${false}
            .showSelectedItem=${true}
            .showConnector=${false}
            .position=${Dialogs.Dialog.DialogVerticalPosition.BOTTOM}
            .buttonTitle=${this.selectedCategory}
            jslog=${VisualLogging.dropDown('timeline.sidebar-insights-category-select').track({click: true})}
          >
          ${Object.values(InsightsCategories).map(insightsCategory => {
            return LitHtml.html`
              <${Menus.Menu.MenuItem.litTagName} .value=${insightsCategory}>
                ${insightsCategory}
              </${Menus.Menu.MenuItem.litTagName}>
            `;
          })}
      </${Menus.SelectMenu.SelectMenu.litTagName}>

      ${this.#renderInsightsForCategory(this.selectedCategory)}
    `;
    // clang-format on
  }

  #renderContent(): LitHtml.TemplateResult|HTMLElement|null {
    switch (this.#activeTab) {
      case SidebarTabsName.INSIGHTS:
        return this.#renderInsightsTabContent();
      case SidebarTabsName.ANNOTATIONS:
        return LitHtml.html`
        <${SidebarAnnotationsTab.SidebarAnnotationsTab.litTagName} .annotations=${this.#annotations}></${
            SidebarAnnotationsTab.SidebarAnnotationsTab.litTagName}>
      `;
      default:
        return null;
    }
  }

  #updateActiveIndicatorPosition(): void {
    const insightsTabHeaderElement = this.#shadow.querySelector('.tabs-header input:nth-child(1)');
    const annotationTabHeaderElement = this.#shadow.querySelector('.tabs-header input:nth-child(2)');
    const tabSliderElement = this.#shadow.querySelector<HTMLElement>('.tab-slider');
    if (insightsTabHeaderElement && annotationTabHeaderElement && tabSliderElement) {
      const insightsTabHeaderWidth = insightsTabHeaderElement.getBoundingClientRect().width;
      const annotationTabHeaderWidth = annotationTabHeaderElement.getBoundingClientRect().width;

      switch (this.#activeTab) {
        case SidebarTabsName.INSIGHTS:
          tabSliderElement.style.left = '0';
          tabSliderElement.style.width = `${insightsTabHeaderWidth}px`;
          return;
        case SidebarTabsName.ANNOTATIONS:
          tabSliderElement.style.left = `${insightsTabHeaderWidth}px`;
          tabSliderElement.style.width = `${annotationTabHeaderWidth}px`;
          return;
      }
    }
  }

  #render(): void {
    // clang-format off
    const output = LitHtml.html`<div class="sidebar">
      <div class="tab-bar">
        ${this.#renderHeader()}
        <${IconButton.Icon.Icon.litTagName}
          name='left-panel-close'
          @click=${this.#closeButtonClick}
          class="sidebar-toggle-button"
          jslog=${VisualLogging.action('timeline.sidebar-close').track({click: true})}
        ></${IconButton.Icon.Icon.litTagName}>
      </div>
      <div class="tab-slider"></div>
      <div class="tab-headers-bottom-line"></div>
      <div class="sidebar-body">${this.#renderContent()}</div>
    </div>`;
    // clang-format on
    LitHtml.render(output, this.#shadow, {host: this});
    this.#updateActiveIndicatorPosition();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-sidebar': SidebarWidget;
  }
}

customElements.define('devtools-performance-sidebar', SidebarUI);
