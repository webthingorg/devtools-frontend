// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as CrUXManager from '../../../models/crux-manager/crux-manager.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import originMapStyles from './originMap.css.js';

const UIStrings = {
  /**
   * @description Title for a column in a data table representing a site origin used for development
   */
  developmentOrigin: 'Development origin',
  /**
   * @description Title for a column in a data table representing a site origin used by real users in a production environment
   */
  productionOrigin: 'Production origin',
  /**
   * @description Warning message explaining that an input origin is not a valid origin or URL.
   * @example {http//malformed.com} PH1
   */
  invalidOrigin: '"{PH1}" is not a valid origin or URL.',
  /**
   * @description Warning message explaining that an development origin is already mapped to a productionOrigin.
   * @example {https://example.com} PH1
   */
  alreadyMapped: '"{PH1}" is already mapped to a production origin.',
  /**
   * @description Warning message explaining that a page doesn't have enough real user data to show any information for. "Chrome UX Report" is a product name and should not be translated.
   */
  pageHasNoData: 'The Chrome UX Report does not have sufficient real user data for this page.',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/OriginMap.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

interface ListItem extends CrUXManager.OriginMapping {
  isTitleRow?: boolean;
}

export class OriginMap extends UI.Widget.Widget implements UI.ListWidget.Delegate<ListItem> {
  readonly #list: UI.ListWidget.ListWidget<ListItem>;
  #editor?: UI.ListWidget.Editor<ListItem>;

  constructor() {
    super();

    this.#list = new UI.ListWidget.ListWidget<ListItem>(this, false /* delegatesFocus */, true /* isTable */);
    this.#list.show(this.element);

    CrUXManager.CrUXManager.instance().getConfigSetting().addChangeListener(this.#updateListFromSetting, this);
  }

  override wasShown(): void {
    super.wasShown();
    this.#updateListFromSetting();
    this.registerCSSFiles([originMapStyles]);
    this.#list.registerCSSFiles([originMapStyles]);
  }

  #pullMappingsFromSetting(): ListItem[] {
    return CrUXManager.CrUXManager.instance().getConfigSetting().get().originMappings || [];
  }

  #pushMappingsToSetting(originMappings: ListItem[]): void {
    const setting = CrUXManager.CrUXManager.instance().getConfigSetting();
    const settingCopy = {...setting.get()};
    settingCopy.originMappings = originMappings;
    setting.set(settingCopy);
  }

  #updateListFromSetting(): void {
    const mappings = this.#pullMappingsFromSetting();
    this.#list.clear();
    this.#list.appendItem(
        {
          developmentOrigin: i18nString(UIStrings.developmentOrigin),
          productionOrigin: i18nString(UIStrings.productionOrigin),
          isTitleRow: true,
        },
        false);
    for (const originMapping of mappings) {
      this.#list.appendItem(originMapping, true);
    }
  }

  #getOrigin(url: string): string|null {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  async #renderOriginWarning(url: string): Promise<LitHtml.LitTemplate> {
    if (!CrUXManager.CrUXManager.instance().isEnabled()) {
      return LitHtml.nothing;
    }

    const cruxManager = CrUXManager.CrUXManager.instance();
    const result = await cruxManager.getFieldDataForPage(url);
    if (Object.values(result).some(v => v)) {
      return LitHtml.nothing;
    }

    return LitHtml.html`
      <${IconButton.Icon.Icon.litTagName}
        class="origin-warning-icon"
        name="warning-filled"
        title=${i18nString(UIStrings.pageHasNoData)}
      >
      </${IconButton.Icon.Icon.litTagName}>
    `;
  }

  startCreation(): void {
    const targetManager = SDK.TargetManager.TargetManager.instance();
    const inspectedURL = targetManager.inspectedURL();
    const currentOrigin = this.#getOrigin(inspectedURL) || '';

    this.#list.addNewItem(-1, {
      developmentOrigin: currentOrigin,
      productionOrigin: '',
    });
  }

  renderItem(originMapping: ListItem): Element {
    const element = document.createElement('div');
    element.classList.add('origin-mapping-row');
    element.role = 'row';

    let cellRole = 'cell';
    let warningIcon;
    if (originMapping.isTitleRow) {
      cellRole = 'columnheader';
      element.classList.add('header');
      warningIcon = LitHtml.nothing;
    } else {
      warningIcon = LitHtml.Directives.until(this.#renderOriginWarning(originMapping.productionOrigin));
    }

    // clang-format off
    LitHtml.render(LitHtml.html`
      <div class="origin-mapping-cell development-origin" role=${cellRole}>
        <div class="origin" title=${originMapping.developmentOrigin}>${originMapping.developmentOrigin}</div>
      </div>
      <div class="origin-mapping-cell production-origin" role=${cellRole}>
        ${warningIcon}
        <div class="origin" title=${originMapping.productionOrigin}>${originMapping.productionOrigin}</div>
      </div>
    `, element, {host: this});
    // clang-format on
    return element;
  }

  removeItemRequested(_item: ListItem, index: number): void {
    const mappings = this.#pullMappingsFromSetting();

    // `index` will be 1-indexed due to the header row
    mappings.splice(index - 1, 1);

    this.#pushMappingsToSetting(mappings);
  }

  commitEdit(originMapping: ListItem, editor: UI.ListWidget.Editor<ListItem>, isNew: boolean): void {
    originMapping.developmentOrigin = this.#getOrigin(editor.control('developmentOrigin').value) || '';
    originMapping.productionOrigin = this.#getOrigin(editor.control('productionOrigin').value) || '';

    const mappings = this.#pullMappingsFromSetting();
    if (isNew) {
      mappings.push(originMapping);
    }
    this.#pushMappingsToSetting(mappings);
  }

  beginEdit(originMapping: ListItem): UI.ListWidget.Editor<ListItem> {
    const editor = this.#createEditor();
    editor.control('developmentOrigin').value = originMapping.developmentOrigin;
    editor.control('productionOrigin').value = originMapping.productionOrigin;
    return editor;
  }

  #developmentValidator(_item: ListItem, index: number, input: UI.ListWidget.EditorControl):
      UI.ListWidget.ValidatorResult {
    const origin = this.#getOrigin(input.value);

    if (!origin) {
      return {valid: false, errorMessage: i18nString(UIStrings.invalidOrigin, {PH1: input.value})};
    }

    const mappings = this.#pullMappingsFromSetting();
    for (let i = 0; i < mappings.length; ++i) {
      // `index` will be 1-indexed due to the header row
      if (i === index - 1) {
        continue;
      }

      const mapping = mappings[i];
      if (mapping.developmentOrigin === origin) {
        return {valid: true, errorMessage: i18nString(UIStrings.alreadyMapped, {PH1: origin})};
      }
    }

    return {valid: true};
  }

  #productionValidator(_item: ListItem, _index: number, input: UI.ListWidget.EditorControl):
      UI.ListWidget.ValidatorResult {
    const origin = this.#getOrigin(input.value);

    if (!origin) {
      return {valid: false, errorMessage: i18nString(UIStrings.invalidOrigin, {PH1: input.value})};
    }

    return {valid: true};
  }

  #createEditor(): UI.ListWidget.Editor<ListItem> {
    if (this.#editor) {
      return this.#editor;
    }

    const editor = new UI.ListWidget.Editor<ListItem>();
    this.#editor = editor;
    const content = editor.contentElement().createChild('div', 'origin-mapping-editor') as HTMLElement;

    const devInput = editor.createInput(
        'developmentOrigin', 'text', i18nString(UIStrings.developmentOrigin), this.#developmentValidator.bind(this));
    const prodInput = editor.createInput(
        'productionOrigin', 'text', i18nString(UIStrings.productionOrigin), this.#productionValidator.bind(this));

    // clang-format off
    LitHtml.render(LitHtml.html`
      <label>
        ${i18nString(UIStrings.developmentOrigin)}
        ${devInput}
      </label>
      <label>
        ${i18nString(UIStrings.productionOrigin)}
        ${prodInput}
      </label>
    `, content, {host: this});
    // clang-format on

    return editor;
  }
}
