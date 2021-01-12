// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */
import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {AXAttributes, AXNativeSourceTypes, AXSourceTypes} from './AccessibilityStrings.js';
import {AccessibilitySubPane} from './AccessibilitySubPane.js';

export class AXNodeSubPane extends AccessibilitySubPane {
  _axNode: SDK.AccessibilityModel.AccessibilityNode|null;
  _noNodeInfo: Element;
  _ignoredInfo: Element;
  _treeOutline: UI.TreeOutline.TreeOutline;
  _ignoredReasonsTree: UI.TreeOutline.TreeOutline;
  constructor() {
    super(ls`Computed Properties`);

    /**
     * @protected
     */
    this._axNode = null;

    this.contentElement.classList.add('ax-subpane');

    this._noNodeInfo = this.createInfo(ls`No accessibility node`);
    this._ignoredInfo = this.createInfo(ls`Accessibility node not exposed`, 'ax-ignored-info hidden');

    this._treeOutline = this.createTreeOutline();
    this._ignoredReasonsTree = this.createTreeOutline();

    this.element.classList.add('accessibility-computed');
    this.registerRequiredCSS('accessibility/accessibilityNode.css', {enableLegacyPatching: false});
    this._treeOutline.setFocusable(true);
  }

  setAXNode(axNode: SDK.AccessibilityModel.AccessibilityNode|null): void {
    if (this._axNode === axNode) {
      return;
    }
    this._axNode = axNode;

    const treeOutline = this._treeOutline;
    treeOutline.removeChildren();
    const ignoredReasons = this._ignoredReasonsTree;
    ignoredReasons.removeChildren();

    if (!axNode) {
      treeOutline.element.classList.add('hidden');
      this._ignoredInfo.classList.add('hidden');
      ignoredReasons.element.classList.add('hidden');

      this._noNodeInfo.classList.remove('hidden');
      this.element.classList.add('ax-ignored-node-pane');

      return;
    }

    if (axNode.ignored()) {
      this._noNodeInfo.classList.add('hidden');
      treeOutline.element.classList.add('hidden');
      this.element.classList.add('ax-ignored-node-pane');

      this._ignoredInfo.classList.remove('hidden');
      ignoredReasons.element.classList.remove('hidden');
      function addIgnoredReason(property: Protocol.Accessibility.AXProperty): void {
        ignoredReasons.appendChild(
            new AXNodeIgnoredReasonTreeElement(property, (axNode as SDK.AccessibilityModel.AccessibilityNode)));
      }
      const ignoredReasonsArray = (axNode.ignoredReasons() as Protocol.Accessibility.AXProperty[]);
      for (const reason of ignoredReasonsArray) {
        addIgnoredReason(reason);
      }
      if (!ignoredReasons.firstChild()) {
        ignoredReasons.element.classList.add('hidden');
      }
      return;
    }
    this.element.classList.remove('ax-ignored-node-pane');

    this._ignoredInfo.classList.add('hidden');
    ignoredReasons.element.classList.add('hidden');
    this._noNodeInfo.classList.add('hidden');

    treeOutline.element.classList.remove('hidden');

    function addProperty(property: SDK.AccessibilityModel.CoreOrProtocolAxProperty): void {
      treeOutline.appendChild(
          new AXNodePropertyTreePropertyElement(property, (axNode as SDK.AccessibilityModel.AccessibilityNode)));
    }

    for (const property of axNode.coreProperties()) {
      addProperty(property);
    }

    const role = axNode.role();
    if (role) {
      const roleProperty: SDK.AccessibilityModel.CoreOrProtocolAxProperty = {
        name: SDK.AccessibilityModel.CoreAxPropertyName.Role,
        value: role,
      };
      addProperty(roleProperty);
    }
    for (const property of /** @type {!Array.<!Protocol.Accessibility.AXProperty>} */ (
             axNode.properties() as Protocol.Accessibility.AXProperty[])) {
      addProperty(property);
    }

    const firstNode = treeOutline.firstChild();
    if (firstNode) {
      firstNode.select(/* omitFocus= */ true, /* selectedByUser= */ false);
    }
  }

  setNode(node: SDK.DOMModel.DOMNode|null): void {
    super.setNode(node);
    this._axNode = null;
  }
}

export class AXNodePropertyTreeElement extends UI.TreeOutline.TreeElement {
  _axNode: SDK.AccessibilityModel.AccessibilityNode;
  constructor(axNode: SDK.AccessibilityModel.AccessibilityNode) {
    // Pass an empty title, the title gets made later in onattach.
    super('');
    this._axNode = axNode;
  }

  static createSimpleValueElement(type: Protocol.Accessibility.AXValueType|null, value: string): Element {
    let valueElement;
    const AXValueType = Protocol.Accessibility.AXValueType;
    if (!type || type === AXValueType.ValueUndefined || type === AXValueType.ComputedString) {
      valueElement = document.createElement('span');
    } else {
      valueElement = document.createElement('span');
      valueElement.classList.add('monospace');
    }
    let valueText;
    const isStringProperty = type && StringProperties.has(type);
    if (isStringProperty) {
      // Render \n as a nice unicode cr symbol.
      valueText = '"' + value.replace(/\n/g, '\u21B5') + '"';
    } else {
      valueText = String(value);
    }

    if (type && type in TypeStyles) {
      valueElement.classList.add(TypeStyles[type]);
    }

    valueElement.setTextContentTruncatedIfNeeded(valueText || '');

    UI.Tooltip.Tooltip.install(valueElement, String(value) || '');

    return valueElement;
  }

  static createExclamationMark(tooltip: string): Element {
    const exclamationElement = (document.createElement('span', {is: 'dt-icon-label'}) as UI.UIUtils.DevToolsIconLabel);
    exclamationElement.type = 'smallicon-warning';
    UI.Tooltip.Tooltip.install(exclamationElement, tooltip);
    return exclamationElement;
  }

  appendNameElement(name: string): void {
    const nameElement = document.createElement('span');
    if (name in AXAttributes) {
      // @ts-ignore TS can't cast name here but we checked it's valid.
      const attribute = AXAttributes[name];
      nameElement.textContent = attribute.name;
      UI.Tooltip.Tooltip.install(nameElement, attribute.description);
      nameElement.classList.add('ax-readable-name');
    } else {
      nameElement.textContent = name;
      nameElement.classList.add('ax-name');
      nameElement.classList.add('monospace');
    }
    this.listItemElement.appendChild(nameElement);
  }

  appendValueElement(value: Protocol.Accessibility.AXValue): void {
    const AXValueType = Protocol.Accessibility.AXValueType;
    if (value.type === AXValueType.Idref || value.type === AXValueType.Node || value.type === AXValueType.IdrefList ||
        value.type === AXValueType.NodeList) {
      this.appendRelatedNodeListValueElement(value);
      return;
    }
    if (value.sources) {
      const sources = value.sources;
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const child = new AXValueSourceTreeElement(source, this._axNode);
        this.appendChild(child);
      }
      this.expand();
    }
    const element = AXNodePropertyTreeElement.createSimpleValueElement(value.type, String(value.value));
    this.listItemElement.appendChild(element);
  }

  appendRelatedNode(relatedNode: Protocol.Accessibility.AXRelatedNode, _index: number): void {
    const deferredNode =
        new SDK.DOMModel.DeferredDOMNode(this._axNode.accessibilityModel().target(), relatedNode.backendDOMNodeId);
    const nodeTreeElement =
        new AXRelatedNodeSourceTreeElement({deferredNode: deferredNode, idref: undefined}, relatedNode);
    this.appendChild(nodeTreeElement);
  }

  appendRelatedNodeInline(relatedNode: Protocol.Accessibility.AXRelatedNode): void {
    const deferredNode =
        new SDK.DOMModel.DeferredDOMNode(this._axNode.accessibilityModel().target(), relatedNode.backendDOMNodeId);
    const linkedNode = new AXRelatedNodeElement({deferredNode: deferredNode, idref: undefined}, relatedNode);
    this.listItemElement.appendChild(linkedNode.render());
  }

  appendRelatedNodeListValueElement(value: Protocol.Accessibility.AXValue): void {
    if (value.relatedNodes && value.relatedNodes.length === 1 && !value.value) {
      this.appendRelatedNodeInline(value.relatedNodes[0]);
      return;
    }

    if (value.relatedNodes) {
      value.relatedNodes.forEach(this.appendRelatedNode, this);
    }
    if (value.relatedNodes && value.relatedNodes.length <= 3) {
      this.expand();
    } else {
      this.collapse();
    }
  }
}

export const TypeStyles: {[x: string]: string;} = {
  attribute: 'ax-value-string',
  boolean: 'object-value-boolean',
  booleanOrUndefined: 'object-value-boolean',
  computedString: 'ax-readable-string',
  idref: 'ax-value-string',
  idrefList: 'ax-value-string',
  integer: 'object-value-number',
  internalRole: 'ax-internal-role',
  number: 'ax-value-number',
  role: 'ax-role',
  string: 'ax-value-string',
  tristate: 'object-value-boolean',
  valueUndefined: 'ax-value-undefined',
};

export const StringProperties: Set<Protocol.Accessibility.AXValueType> = new Set<Protocol.Accessibility.AXValueType>([
  Protocol.Accessibility.AXValueType.String,
  Protocol.Accessibility.AXValueType.ComputedString,
  Protocol.Accessibility.AXValueType.IdrefList,
  Protocol.Accessibility.AXValueType.Idref,
]);

export class AXNodePropertyTreePropertyElement extends AXNodePropertyTreeElement {
  _property: SDK.AccessibilityModel.CoreOrProtocolAxProperty;
  toggleOnClick: boolean;
  constructor(
      property: SDK.AccessibilityModel.CoreOrProtocolAxProperty, axNode: SDK.AccessibilityModel.AccessibilityNode) {
    super(axNode);

    this._property = property;
    this.toggleOnClick = true;

    this.listItemElement.classList.add('property');
  }

  onattach(): void {
    this._update();
  }

  _update(): void {
    this.listItemElement.removeChildren();

    this.appendNameElement(this._property.name);

    this.listItemElement.createChild('span', 'separator').textContent = ':\xA0';

    this.appendValueElement(this._property.value);
  }
}

export class AXValueSourceTreeElement extends AXNodePropertyTreeElement {
  _source: Protocol.Accessibility.AXValueSource;
  constructor(source: Protocol.Accessibility.AXValueSource, axNode: SDK.AccessibilityModel.AccessibilityNode) {
    super(axNode);
    this._source = source;
  }

  onattach(): void {
    this._update();
  }

  appendRelatedNodeWithIdref(relatedNode: Protocol.Accessibility.AXRelatedNode, idref: string): void {
    const deferredNode =
        new SDK.DOMModel.DeferredDOMNode(this._axNode.accessibilityModel().target(), relatedNode.backendDOMNodeId);
    const nodeTreeElement = new AXRelatedNodeSourceTreeElement({deferredNode: deferredNode, idref: idref}, relatedNode);
    this.appendChild(nodeTreeElement);
  }

  appendIDRefValueElement(value: Protocol.Accessibility.AXValue): void {
    if (value.value === null) {
      return;
    }

    const relatedNodes = value.relatedNodes || [];

    // Content attribute is empty, but if the relationship was set via the IDL
    // then there may be related nodes.
    if (value.value === '') {
      for (const node of relatedNodes) {
        const idref = node.idref || '';
        this.appendRelatedNodeWithIdref(node, idref);
      }
      return;
    }

    const idrefs = value.value.trim().split(/\s+/);
    for (const idref of idrefs) {
      const matchingNode =
          relatedNodes.find((node: Protocol.Accessibility.AXRelatedNode): boolean => node.idref === idref);

      // If there is exactly one related node, it is rendered on the same line
      // of the label. If there are more, they are each rendered on their own
      // line below the label.
      // TODO(aboxhall): exclamation mark if not idreflist type
      if (matchingNode) {
        this.appendRelatedNodeWithIdref(matchingNode, idref);
      } else if (idrefs.length === 1) {
        this.listItemElement.appendChild(new AXRelatedNodeElement({deferredNode: undefined, idref: idref}).render());
      } else {
        this.appendChild(new AXRelatedNodeSourceTreeElement({deferredNode: undefined, idref: idref}));
      }
    }
  }

  appendRelatedNodeListValueElement(value: Protocol.Accessibility.AXValue): void {
    const relatedNodes = value.relatedNodes;
    const numNodes = relatedNodes ? relatedNodes.length : 0;

    if (value.type === Protocol.Accessibility.AXValueType.IdrefList ||
        value.type === Protocol.Accessibility.AXValueType.Idref) {
      this.appendIDRefValueElement(value);
    } else {
      super.appendRelatedNodeListValueElement(value);
    }

    if (numNodes <= 3) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  appendSourceNameElement(source: Protocol.Accessibility.AXValueSource): void {
    const nameElement = document.createElement('span');
    const AXValueSourceType = Protocol.Accessibility.AXValueSourceType;
    const type = source.type;
    switch (type) {
      case AXValueSourceType.Attribute:
      case AXValueSourceType.Placeholder:
      case AXValueSourceType.RelatedElement:
        if (source.nativeSource) {
          const nativeSource = source.nativeSource;
          nameElement.textContent = AXNativeSourceTypes[nativeSource].name;
          UI.Tooltip.Tooltip.install(nameElement, AXNativeSourceTypes[nativeSource].description);
          nameElement.classList.add('ax-readable-name');
          break;
        }
        nameElement.textContent = source.attribute || null;
        nameElement.classList.add('ax-name');
        nameElement.classList.add('monospace');
        break;
      default:
        if (type in AXSourceTypes) {
          nameElement.textContent = AXSourceTypes[type].name;
          UI.Tooltip.Tooltip.install(nameElement, AXSourceTypes[type].description);
          nameElement.classList.add('ax-readable-name');
        } else {
          console.warn(type, 'not in AXSourceTypes');
          nameElement.textContent = type;
        }
    }
    this.listItemElement.appendChild(nameElement);
  }

  _update(): void {
    this.listItemElement.removeChildren();

    if (this._source.invalid) {
      const exclamationMark = AXNodePropertyTreeElement.createExclamationMark(ls`Invalid source.`);
      this.listItemElement.appendChild(exclamationMark);
      this.listItemElement.classList.add('ax-value-source-invalid');
    } else if (this._source.superseded) {
      this.listItemElement.classList.add('ax-value-source-unused');
    }

    this.appendSourceNameElement(this._source);

    this.listItemElement.createChild('span', 'separator').textContent = ':\xA0';

    if (this._source.attributeValue) {
      this.appendValueElement(this._source.attributeValue);
      UI.UIUtils.createTextChild(this.listItemElement, '\xA0');
    } else if (this._source.nativeSourceValue) {
      this.appendValueElement(this._source.nativeSourceValue);
      UI.UIUtils.createTextChild(this.listItemElement, '\xA0');
      if (this._source.value) {
        this.appendValueElement(this._source.value);
      }
    } else if (this._source.value) {
      this.appendValueElement(this._source.value);
    } else {
      const valueElement = AXNodePropertyTreeElement.createSimpleValueElement(
          Protocol.Accessibility.AXValueType.ValueUndefined, ls`Not specified`);
      this.listItemElement.appendChild(valueElement);
      this.listItemElement.classList.add('ax-value-source-unused');
    }

    if (this._source.value && this._source.superseded) {
      this.listItemElement.classList.add('ax-value-source-superseded');
    }
  }
}

export class AXRelatedNodeSourceTreeElement extends UI.TreeOutline.TreeElement {
  _value: Protocol.Accessibility.AXRelatedNode|undefined;
  _axRelatedNodeElement: AXRelatedNodeElement;
  selectable: boolean;
  constructor(
      node: {deferredNode: (SDK.DOMModel.DeferredDOMNode|undefined); idref: (string | undefined);},
      value?: Protocol.Accessibility.AXRelatedNode|undefined) {
    super('');

    this._value = value;
    this._axRelatedNodeElement = new AXRelatedNodeElement(node, value);
    this.selectable = true;
  }

  onattach(): void {
    this.listItemElement.appendChild(this._axRelatedNodeElement.render());
    if (!this._value) {
      return;
    }

    if (this._value.text) {
      this.listItemElement.appendChild(AXNodePropertyTreeElement.createSimpleValueElement(
          Protocol.Accessibility.AXValueType.ComputedString, this._value.text));
    }
  }

  onenter(): boolean {
    this._axRelatedNodeElement.revealNode();
    return true;
  }
}

export class AXRelatedNodeElement {
  _deferredNode: SDK.DOMModel.DeferredDOMNode|undefined;
  _idref: string|undefined;
  _value: Protocol.Accessibility.AXRelatedNode|undefined;
  constructor(
      node: {deferredNode: (SDK.DOMModel.DeferredDOMNode|undefined); idref: (string | undefined);},
      value?: Protocol.Accessibility.AXRelatedNode|undefined) {
    this._deferredNode = node.deferredNode;
    this._idref = node.idref;
    this._value = value;
  }

  render(): Element {
    const element = document.createElement('span');

    if (this._deferredNode) {
      const valueElement = document.createElement('span');
      element.appendChild(valueElement);
      this._deferredNode.resolvePromise().then((node: SDK.DOMModel.DOMNode|null): void => {
        Common.Linkifier.Linkifier.linkify(node, {tooltip: undefined, preventKeyboardFocus: true})
            .then((linkfied: Node): Node => valueElement.appendChild(linkfied));
      });
    } else if (this._idref) {
      element.classList.add('invalid');
      const valueElement = AXNodePropertyTreeElement.createExclamationMark(ls`No node with this ID.`);
      UI.UIUtils.createTextChild(valueElement, this._idref);
      element.appendChild(valueElement);
    }

    return element;
  }

  /**
   * Attempts to cause the node referred to by the related node to be selected in the tree.
   */
  revealNode(): void {
    if (this._deferredNode) {
      this._deferredNode.resolvePromise().then(
          (node: SDK.DOMModel.DOMNode|null): Promise<void> => Common.Revealer.reveal(node));
    }
  }
}

export class AXNodeIgnoredReasonTreeElement extends AXNodePropertyTreeElement {
  _property: Protocol.Accessibility.AXProperty;
  _axNode: SDK.AccessibilityModel.AccessibilityNode;
  toggleOnClick: boolean;
  selectable: boolean;
  _reasonElement: Element|null|undefined;
  constructor(property: Protocol.Accessibility.AXProperty, axNode: SDK.AccessibilityModel.AccessibilityNode) {
    super(axNode);
    this._property = property;
    this._axNode = axNode;
    this.toggleOnClick = true;
    this.selectable = false;
  }

  static createReasonElement(reason: string|null, axNode: SDK.AccessibilityModel.AccessibilityNode|null): Element|null {
    let reasonElement: Element|null = null;
    switch (reason) {
      case 'activeModalDialog':
        reasonElement = UI.UIUtils.formatLocalized('Element is hidden by active modal dialog:\xA0', []);
        break;
      case 'ancestorIsLeafNode':
        reasonElement = UI.UIUtils.formatLocalized('Ancestor\'s children are all presentational:\xA0', []);
        break;
      case 'ariaHiddenElement': {
        const ariaHiddenSpan = document.createElement('span', {is: 'source-code'}).textContent = 'aria-hidden';
        reasonElement = UI.UIUtils.formatLocalized('Element is %s.', [ariaHiddenSpan]);
        break;
      }
      case 'ariaHiddenSubtree': {
        const ariaHiddenSpan = document.createElement('span', {is: 'source-code'}).textContent = 'aria-hidden';
        const trueSpan = document.createElement('span', {is: 'source-code'}).textContent = 'true';
        reasonElement = UI.UIUtils.formatLocalized('%s is %s on ancestor:\xA0', [ariaHiddenSpan, trueSpan]);
        break;
      }
      case 'emptyAlt':
        reasonElement = UI.UIUtils.formatLocalized('Element has empty alt text.', []);
        break;
      case 'emptyText':
        reasonElement = UI.UIUtils.formatLocalized('No text content.', []);
        break;
      case 'inertElement':
        reasonElement = UI.UIUtils.formatLocalized('Element is inert.', []);
        break;
      case 'inertSubtree':
        reasonElement = UI.UIUtils.formatLocalized('Element is in an inert subtree from\xA0', []);
        break;
      case 'inheritsPresentation':
        reasonElement = UI.UIUtils.formatLocalized('Element inherits presentational role from\xA0', []);
        break;
      case 'labelContainer':
        reasonElement = UI.UIUtils.formatLocalized('Part of label element:\xA0', []);
        break;
      case 'labelFor':
        reasonElement = UI.UIUtils.formatLocalized('Label for\xA0', []);
        break;
      case 'notRendered':
        reasonElement = UI.UIUtils.formatLocalized('Element is not rendered.', []);
        break;
      case 'notVisible':
        reasonElement = UI.UIUtils.formatLocalized('Element is not visible.', []);
        break;
      case 'presentationalRole': {
        const role = axNode && axNode.role() || '';
        const rolePresentationSpan = document.createElement('span', {is: 'source-code'}).textContent = 'role=' + role;
        reasonElement = UI.UIUtils.formatLocalized('Element has %s.', [rolePresentationSpan]);
        break;
      }
      case 'probablyPresentational':
        reasonElement = UI.UIUtils.formatLocalized('Element is presentational.', []);
        break;
      case 'staticTextUsedAsNameFor':
        reasonElement = UI.UIUtils.formatLocalized('Static text node is used as name for\xA0', []);
        break;
      case 'uninteresting':
        reasonElement = UI.UIUtils.formatLocalized('Element not interesting for accessibility.', []);
        break;
    }
    if (reasonElement) {
      reasonElement.classList.add('ax-reason');
    }
    return reasonElement;
  }

  onattach(): void {
    this.listItemElement.removeChildren();

    this._reasonElement = AXNodeIgnoredReasonTreeElement.createReasonElement(this._property.name, this._axNode);
    if (this._reasonElement) {
      this.listItemElement.appendChild(this._reasonElement);
    }

    const value = this._property.value;
    if (value.type === Protocol.Accessibility.AXValueType.Idref) {
      this.appendRelatedNodeListValueElement(value);
    }
  }
}
