// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';

import {generateInterfaces} from '../../../../scripts/component_bridges/generate_closure';
import {WalkerState, walkTree} from '../../../../scripts/component_bridges/walk_tree';

import {createTypeScriptSourceFile} from './test_utils';

const parseCode = (code: string): WalkerState => {
  const sourceFile = createTypeScriptSourceFile(code);
  const result = walkTree(sourceFile);
  return result;
};

describe('generateClosure', () => {
  describe('generateInterfaces', () => {
    it('only generates interfaces taken by public methods', () => {
      const state = parseCode(`interface Person {
        name: string
        age: number
      }

      interface Dog {
        name: string
        goodDog: boolean
      }

      class Breadcrumbs extends HTMLElement {
        private render(dog: Dog) {}

        public update(person: Person) {}
      }`);

      const interfaces = generateInterfaces(state);

      assert.equal(interfaces.length, 1);
      assert.isTrue(interfaces[0].join('').includes('export let Person'));
    });

    it('can convert a basic interface into a Closure one', () => {
      const state = parseCode(`interface Person {
        name: string
        age: number
      }

      class Breadcrumbs extends HTMLElement {
        public update(person: Person) {}
      }`);

      const interfaces = generateInterfaces(state);

      assert.equal(interfaces.length, 1);
      assert.include(interfaces[0].join('\n'), `* @typedef {{
* name:string
* age:number
* }}`);
    });

    it('includes the export with the @ts-ignore', () => {
      const state = parseCode(`interface Person {
        name: string
        age: number
      }

      class Breadcrumbs extends HTMLElement {
        public update(person: Person) {}
      }`);

      const interfaces = generateInterfaces(state);

      assert.equal(interfaces.length, 1);
      assert.include(interfaces[0].join('\n'), `// @ts-ignore we export this for Closure not TS
export let Person`);
    });

    it('correctly marks optional keys', () => {
      const state = parseCode(`interface Person {
        name?: string
        age: number
      }

      class Breadcrumbs extends HTMLElement {
        public update(person: Person) {}
      }`);

      const interfaces = generateInterfaces(state);

      assert.equal(interfaces.length, 1);
      assert.include(interfaces[0].join('\n'), `* @typedef {{
* name:?string
* age:number
* }}`);
    });
  });
});
