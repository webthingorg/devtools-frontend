// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Buttons from '../../ui/components/buttons/buttons.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as Input from '../../ui/components/input/input.js';
import * as LegacyWrapper from '../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

import aiSettingsTabStyles from './aiSettingsTab.css.js';

const UIStrings = {
  /**
   *@description Header text for for a list of things to consider in the context of generative AI features
   */
  boostYourProductivity: 'Boost your productivity with Chrome AI',
  /**
   *@description Text announcing a list of facts to consider (when using a GenAI feature)
   */
  thingsToConsider: 'Things to consider',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  experimentalFeatures: 'These features are experimental and may change',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  maybeInaccurate:
      'These features use generative AI and may provide inaccurate or offensive information that do not represent Google’s views',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  sendsDataToGoogle:
      'Using these features sends data relevant for the feature to Google. Please find more feature-specific information below.',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  collectData:
      'Google collects this data and feedback to improve its products and services with the help of human reviewers. Avoid sharing sensitive or personal information.',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  retainData:
      'Usage data will be stored in a way where Google cannot tell who provided it and can no longer fulfill any deletion requests and will be retained for up to 18 months',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  managedAccount: 'Google may refrain from data collection depending on your Google account management and/or region',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  adminSettings: 'Features available to managed users may vary depending upon their administrator’s settings',
  /**
   *@description Text describing the 'Console Insights' feature
   */
  helpUnderstandConsole: 'Helps you understand and fix console warnings and errors',
  /**
   *@description Label for a button to collapse an accordion
   */
  collapse: 'collapse',
  /**
   *@description Label for a button to expand an accordion
   */
  expand: 'expand',
  /**
   *@description Header for a list of feature attributes. 'When (the feature is turned) on, you'll be able to ...'
   */
  whenOn: 'When on',
  /**
   *@description Description of the console insights feature
   */
  explainConsole: 'Get explanations for console warnings and errors',
  /**
   *@description Description of the console insights feature ('these issues' refers to console warnings and errors)
   */
  receiveSuggestions: 'Receive suggestions and code samples to address these issues',
  /**
   *@description Explainer for which data is being sent by the console insights feature
   */
  consoleInsightsSendsData:
      'The console message, associated stack trace, related source code, and the associated network headers are sent to Google to generate explanations. This data may be seen by human reviewers to improve this feature.',
  /**
   *@description Reference to the terms of service and privacy notice
   *@example {Google Terms of Service} PH1
   *@example {Privacy Notice} PH2
   */
  termsOfServicePrivacyNotice: 'Use of this feature is subject to the {PH1} and {PH2}',
  /**
   *@description Label for a link to a URL, which asks to use generated code responsibly
   */
  generatedSnippets: 'Use generated code snippets with caution',
  /**
   *@description Text which is a hyperlink to more documentation
   */
  learnMore: 'Learn more',
  /**
   *@description Label for a link to the terms of service
   */
  termsOfService: 'Google Terms of Service',
  /**
   *@description Label for a link to the privacy notice
   */
  privacyNotice: 'Privacy Notice',
  /**
   *@description Message to display if a setting change requires a reload of DevTools
   */
  oneOrMoreSettingsHaveChanged: 'One or more settings have changed which requires a reload to take effect.',
  /**
   *@description Header for the Chrome AI settings page
   */
  chromeAi: 'Chrome AI',
};
const str_ = i18n.i18n.registerUIStrings('panels/settings/AISettingsTab.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const chevronDownIconUrl = new URL('../../Images/chevron-down.svg', import.meta.url).toString();
const chevronUpIconUrl = new URL('../../Images/chevron-up.svg', import.meta.url).toString();

export class AISettingsTab extends LegacyWrapper.LegacyWrapper.WrappableComponent {
  static readonly litTagName = LitHtml.literal`devtools-settings-ai-settings-tab`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #consoleInsightsSetting?: Common.Settings.Setting<boolean>;
  #isConsoleInsightsSettingExpanded: boolean;
  #shouldAnimate = false;  // Allows not animating on initial render

  constructor() {
    super();
    try {
      this.#consoleInsightsSetting = Common.Settings.Settings.instance().moduleSetting('console-insights-enabled');
      this.#isConsoleInsightsSettingExpanded = this.#consoleInsightsSetting.get();
    } catch {
      this.#consoleInsightsSetting = undefined;
      this.#isConsoleInsightsSettingExpanded = false;
    }
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [Input.checkboxStyles, aiSettingsTabStyles];
  }

  disconnectedCallback(): void {
    this.#shouldAnimate = false;
  }

  #expandConsoleInsightsSetting(): void {
    this.#isConsoleInsightsSettingExpanded = !this.#isConsoleInsightsSettingExpanded;
    this.#shouldAnimate = true;
    void this.render();
  }

  #onConsoleInsightsCheckboxChanged(e: Event): void {
    const {checked} = e.target as HTMLInputElement;
    this.#consoleInsightsSetting?.set(checked);
    UI.InspectorView.InspectorView.instance().displayReloadRequiredWarning(
        i18nString(UIStrings.oneOrMoreSettingsHaveChanged));
    if (checked && !this.#isConsoleInsightsSettingExpanded) {
      this.#expandConsoleInsightsSetting();
    }
  }

  #renderSharedDisclaimerItem(icon: string, text: Common.UIString.LocalizedString): LitHtml.TemplateResult {
    return LitHtml.html`
      <div>
        <${IconButton.Icon.Icon.litTagName} .data=${{
      iconName: icon,
      color: 'var(--icon-default)',
      width: 'var(--sys-size-8)',
      height: 'var(--sys-size-8)',
    } as IconButton.Icon.IconData}></${IconButton.Icon.Icon.litTagName}>
      </div>
      <div>${text}</div>
    `;
  }

  #renderSharedDisclaimer(): LitHtml.TemplateResult {
    const bulletPoints = [
      {icon: 'psychiatry', text: i18nString(UIStrings.experimentalFeatures)},
      {icon: 'report', text: i18nString(UIStrings.maybeInaccurate)},
      {icon: 'google', text: i18nString(UIStrings.sendsDataToGoogle)},
      {icon: 'account-box', text: i18nString(UIStrings.collectData)},
      {icon: 'calendar-today', text: i18nString(UIStrings.retainData)},
      {icon: 'globe', text: i18nString(UIStrings.managedAccount)},
      {icon: 'corporate-fare', text: i18nString(UIStrings.adminSettings)},
    ];
    return LitHtml.html`
      <div class="shared-disclaimer">
        <h2>${i18nString(UIStrings.boostYourProductivity)}</h2>
        <span class="disclaimer-list-header">${i18nString(UIStrings.thingsToConsider)}</span>
        <div class="disclaimer-list">
          ${bulletPoints.map(item => this.#renderSharedDisclaimerItem(item.icon, item.text))}
        </div>
      </div>
    `;
  }

  #renderSettingItem(icon: string, text: Common.UIString.LocalizedString|LitHtml.TemplateResult):
      LitHtml.TemplateResult {
    return LitHtml.html`
      <div>
        <${IconButton.Icon.Icon.litTagName} .data=${{
      iconName: icon,
      color: 'var(--icon-default)',
      width: 'var(--sys-size-9)',
      height: 'var(--sys-size-9)',
    } as IconButton.Icon.IconData}></${IconButton.Icon.Icon.litTagName}>
      </div>
      <div class="padded">${text}</div>
    `;
  }

  #renderConsoleInsightsSetting(): LitHtml.TemplateResult {
    const detailsClasses = {
      'whole-row': true,
      animate: this.#shouldAnimate,
      open: this.#isConsoleInsightsSettingExpanded,
    };
    const tabindex = this.#isConsoleInsightsSettingExpanded ? '0' : '-1';
    const tosLink = UI.XLink.XLink.create(
        'http://policies.google.com/terms', i18nString(UIStrings.termsOfService), undefined, undefined,
        'terms-of-service');
    const privacyNoticeLink = UI.XLink.XLink.create(
        'http://policies.google.com/privacy', i18nString(UIStrings.privacyNotice), undefined, undefined,
        'privacy-notice');

    return LitHtml.html`
      <div class="icon-container centered">
        <${IconButton.Icon.Icon.litTagName} name="lightbulb-spark"></${IconButton.Icon.Icon.litTagName}>
      </div>
      <div class="setting-card">
        <div>${i18n.i18n.lockedString('Console Insights')}</div>
        <div class="setting-description">${i18nString(UIStrings.helpUnderstandConsole)}</div>
      </div>
      <div class="dropdown centered">
        <${Buttons.Button.Button.litTagName}
          title=${
        this.#isConsoleInsightsSettingExpanded ? i18nString(UIStrings.collapse) : i18nString(UIStrings.expand)}
          .size=${Buttons.Button.Size.SMALL}
          .iconUrl=${this.#isConsoleInsightsSettingExpanded ? chevronUpIconUrl : chevronDownIconUrl}
          .variant=${Buttons.Button.Variant.ICON}
          @click=${this.#expandConsoleInsightsSetting}
          jslog=${VisualLogging.action('console-insights.accordion').track({
      click: true,
    })}
        ></${Buttons.Button.Button.litTagName}>
      </div>
      <div class="divider"></div>
      <div class="toggle-container centered">
        <input
          type="checkbox"
          .checked=${this.#consoleInsightsSetting?.get()}
          @change=${this.#onConsoleInsightsCheckboxChanged.bind(this)}
          jslog=${VisualLogging.toggle(this.#consoleInsightsSetting?.name).track({
      change: true,
    })}
        />
      </div>
      <div class=${LitHtml.Directives.classMap(detailsClasses)}>
        <div class="overflow-hidden">
          <div class="expansion-grid">
            <div class="expansion-grid-whole-row">${i18nString(UIStrings.whenOn)}</div>
            ${this.#renderSettingItem('lightbulb', i18nString(UIStrings.explainConsole))}
            ${this.#renderSettingItem('code', i18nString(UIStrings.receiveSuggestions))}
            <div class="expansion-grid-whole-row">${i18nString(UIStrings.thingsToConsider)}</div>
            ${this.#renderSettingItem('google', i18nString(UIStrings.consoleInsightsSendsData))}
            ${this.#renderSettingItem('policy', LitHtml.html`
              ${i18n.i18n.getFormatLocalizedString(str_, UIStrings.termsOfServicePrivacyNotice, {
      PH1: tosLink,
      PH2: privacyNoticeLink,
    })}
            `)}
            ${this.#renderSettingItem('warning', LitHtml.html`
              <x-link
                href="http://support.google.com/legal/answer/13505487"
                class="link"
                tabindex=${tabindex}
                jslog=${VisualLogging.link('code-snippets-explainer.console-insights').track({
      click: true,
    })}
              >${i18nString(UIStrings.generatedSnippets)}</x-link>
            `)}
            <div class="expansion-grid-whole-row">
              <x-link
                href="http://goo.gle/devtools-console-messages-ai"
                class="link"
                tabindex=${tabindex}
                jslog=${VisualLogging.link('learn-more.console-insights').track({
      click: true,
    })}
              >${i18nString(UIStrings.learnMore)}</x-link>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  override async render(): Promise<void> {
    LitHtml.render(
        LitHtml.html`
      <header>${i18nString(UIStrings.chromeAi)}</header>
      <div class="settings-container-wrapper" jslog=${VisualLogging.pane('chrome-ai')}>
        ${this.#renderSharedDisclaimer()}
        <div class="settings-container">
          ${this.#consoleInsightsSetting ? this.#renderConsoleInsightsSetting() : LitHtml.nothing}
        </div>
      </div>
    `,
        this.#shadow, {host: this});
  }
}

customElements.define('devtools-settings-ai-settings-tab', AISettingsTab);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-settings-ai-settings-tab': AISettingsTab;
  }
}
