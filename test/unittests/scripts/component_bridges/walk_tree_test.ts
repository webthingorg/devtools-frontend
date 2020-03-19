// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';
import * as ts from 'typescript';

import {walkTree} from '../../../../scripts/component_bridges/walk_tree';

import {createTypeScriptSourceFile} from './test_utils';


describe('walkTree', () => {
  it('adds any interfaces it finds to state.foundInterfaces', () => {
    const code = `interface Person {
      name: string;
      age: number;
    }

    const notAnInterface = () => {};

    interface Dog {
      name: string;
      goodDog: boolean;
    }`;

    const source = createTypeScriptSourceFile(code);
    const result = walkTree(source);

    const foundInterfaceNames = Array.from(result.foundInterfaces, x => {
      return x.name.escapedText as string;
    });

    assert.deepEqual(foundInterfaceNames, ['Person', 'Dog']);
  });

  describe('finding the custom element class', () => {
    it('picks out the class that extends HTMLElement', () => {
      const code = `class Foo {
        blah() {}
      }

      class Bah extends SomethingElse {}

      class Breadcrumbs extends HTMLElement {}
      }`;

      const source = createTypeScriptSourceFile(code);
      const result = walkTree(source);

      if (!result.componentClass) {
        assert.fail('No component class was found');
      }

      assert.equal(result.componentClass.name.escapedText as string, 'Breadcrumbs');
    });

    it('finds any public functions on the class', () => {
      const code = `class Breadcrumbs extends HTMLElement {

        private render() {
          console.log('render')
        }

        public update() {
          console.log('update')
        }
      }`;

      const source = createTypeScriptSourceFile(code);
      const result = walkTree(source);

      if (!result.componentClass) {
        assert.fail('No component class was found');
      }

      const publicMethodNames = Array.from(result.publicMethods, method => {
        return (method.name as ts.Identifier).escapedText as string;
      });

      assert.deepEqual(publicMethodNames, ['update']);
    });

    it('finds the custom elements define call', () => {
      const code = `class Breadcrumbs extends HTMLElement {

        private render() {
          console.log('render')
        }

        public update() {
          console.log('update')
        }
      }

      customElements.define('devtools-breadcrumbs', Breadcrumbs)`;

      const source = createTypeScriptSourceFile(code);
      const result = walkTree(source);

      assert.isDefined(result.customElementsDefineCall);
    });
  });
});
