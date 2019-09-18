// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const { assert } = chai;
import '../../../front_end/dom_extension/DOMExtension.js';


describe('DataGrid', () => {
    it('Traverse Next Node in Shadow Dom', () => {
        function createSlot(parent, name) {
            const slot = parent.createChild('slot');
            if (name)
                slot.name = name;
            return slot;
        }

        function createChild(parent, tagName, name, text = '') {
            const child = parent.createChild(tagName, name);
            if (name)
                child.slot = name;
            child.textContent = text;
            return child;
        }

        var component1 = createElementWithClass('div', 'component1');
        var shadow1 = component1.attachShadow({mode: 'open'});
        createChild(component1, 'div', 'component1-content', 'text 1');
        createChild(component1, 'div', 'component2-content', 'text 2');
        createChild(component1, 'span', undefined, 'text 3');
        createChild(component1, 'span', 'component1-content', 'text 4');

        var shadow1Content = createElementWithClass('div', 'shadow-component1');
        shadow1.appendChild(shadow1Content);
        createSlot(shadow1Content, 'component1-content');
        createSlot(shadow1Content, null);

        var component2 = shadow1Content.createChild('div', 'component2');
        var shadow2 = component2.attachShadow({mode: 'open'});
        createSlot(component2, 'component2-content');
        createChild(
            component2, 'div', 'component2-content', 'component2 light dom text');

        var shadow2Content = createElementWithClass('div', 'shadow-component1');
        shadow2.appendChild(shadow2Content);
        var midDiv = createChild(shadow2Content, 'div', 'mid-div');
        createChild(midDiv, 'div', undefined, 'component2-text');
        createSlot(midDiv, null);
        createSlot(midDiv, 'component2-content');


        var count = 0;
        var results = [
            "#document-fragment",
            "DIV.shadow-component1",
            "SLOT",
            "DIV.component1-content",
            "text 1",
            "SPAN.component1-content",
            "text 4",
            "SLOT",
            "SPAN",
            "text 3",
            "DIV.component2",
            "#document-fragment",
            "DIV.shadow-component1",
            "DIV.mid-div",
            "DIV",
            "component2-text",
            "SLOT",
            "SLOT",
            "DIV.component2-content",
            "text 2",
            "SLOT",
            "DIV.component2-content",
            "component2 light dom text"
        ];

        var node = component1;
        while ((node = node.traverseNextNode(component1))) {
            var test_val;
            if (node.nodeType === Node.TEXT_NODE)
                test_val = node.nodeValue;
            else
                test_val = node.nodeName + (node.className ? '.' + node.className : '');
            assert.equal(test_val, results[count]);
            count += 1;
        }
    });
});
