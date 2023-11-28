// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../front_end/core/platform/platform.js';
import * as SDK from '../../../../front_end/core/sdk/sdk.js';
import * as Elements from '../../../../front_end/panels/elements/elements.js';
import * as UI from '../../../../front_end/ui/legacy/legacy.js';

export function createSection(
    stylesSidebarPane: Elements.StylesSidebarPane.StylesSidebarPane,
    matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, sectionName?: string, propertyName?: string) {
  const style = sinon.createStubInstance(SDK.CSSStyleDeclaration.CSSStyleDeclaration);
  if (propertyName) {
    const property =
        new SDK.CSSProperty.CSSProperty(style, 0, propertyName, 'value', true, false, true, false, '', undefined);
    style.leadingProperties.returns([property]);
    style.hasActiveProperty.callsFake(name => name === propertyName);
  } else {
    style.leadingProperties.returns([]);
  }
  return new Elements.StylePropertiesSection.StylePropertiesSection(
      stylesSidebarPane, matchedStyles, style,
      /* sectionIdx */ 0, /* computedStyles */ null,
      /* parentsComputedStyles */ null, sectionName);
}

export function createBlockAndSection(
    stylesSidebarPane: Elements.StylesSidebarPane.StylesSidebarPane,
    matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, sectionName?: string, propertyName?: string) {
  const titleElement = sinon.createStubInstance(Element);
  const block = new Elements.StylesSidebarPane.SectionBlock(titleElement, true);
  block.sections = [createSection(stylesSidebarPane, matchedStyles, sectionName, propertyName)];

  return block;
}

export async function setupStylesPane(): Promise<{
  stylesSidebarPane: Elements.StylesSidebarPane.StylesSidebarPane,
  matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles,
}> {
  const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
  Platform.assertNotNullOrUndefined(target);
  const domModel = target.model(SDK.DOMModel.DOMModel);
  Platform.assertNotNullOrUndefined(domModel);
  await domModel.requestDocument();
  UI.Context.Context.instance().setFlavor(SDK.DOMModel.DOMNode, domModel.existingDocument());
  const stylesSidebarPane = Elements.StylesSidebarPane.StylesSidebarPane.instance({forceNew: true});
  const matchedStyles = await SDK.CSSMatchedStyles.CSSMatchedStyles.create({
    cssModel: stylesSidebarPane.cssModel() as SDK.CSSModel.CSSModel,
    node: stylesSidebarPane.node() as SDK.DOMModel.DOMNode,
    inlinePayload: null,
    attributesPayload: null,
    matchedPayload: [],
    pseudoPayload: [],
    inheritedPayload: [],
    inheritedPseudoPayload: [],
    animationsPayload: [],
    parentLayoutNodeId: undefined,
    positionFallbackRules: [],
    propertyRules: [],
    cssPropertyRegistrations: [],
    fontPaletteValuesRule: undefined,
  });
  return {
    stylesSidebarPane,
    matchedStyles,
  };
}
