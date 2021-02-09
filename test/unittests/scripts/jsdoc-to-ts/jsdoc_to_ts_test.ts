// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {execSync} from 'child_process';
import {readFileSync} from 'fs';
import * as ts from 'typescript';

import {getTextWithoutIdentation, removeUnusedJSDocTagsFromNode, Transformer, transformer, transformModule, updateCast, updateEnums, updateExtensionsAndReferences, updateGenericsInSuperClass, updateInterfaceDeclarations, updateInterfacesImplementations, updateMissingGenericsInMaps, updateMissingGenericsInSets, updateOverrides, updateParameters, updatePropertyDeclarations, updateReturnType, updateThisDeclaration, updateTypeDefinitionsForLocalTypes, updateTypedefs, updateVariableDeclarations} from '../../../../scripts/jsdoc-to-ts/jsdoc-to-ts.js';


export function transform(content: string, transformers: Transformer[]) {
  const options = {allowJs: true, checkJS: true};

  const host = ts.createCompilerHost(options);
  host.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget) =>
      ts.createSourceFile(fileName, content, languageVersion, true);
  const program = ts.createProgram(['/test/main.js'], options, host);
  program.emit();

  const sourceFile = program.getSourceFile('/test/main.js');
  if (!sourceFile) {
    throw new Error('Could not find source file.');
  }

  const checker = program.getTypeChecker();
  const result = ts.transform(sourceFile, [transformer(checker, transformers)], options);
  if (!result) {
    throw new Error('Could transform.');
  }
  return result.transformed[0];
}

function getNodeFromString<T extends ts.Node = ts.Node>(
    source: string, callback: null|((node: ts.Node) => node is T) = null): T {
  const src = ts.createSourceFile('main.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (!callback) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return src.statements[0] as any as T;
  }

  const visitor = <T extends ts.Node>(node: ts.Node): T|ts.Node|undefined => {
    if (callback(node)) {
      return node;
    }
    return ts.forEachChild(node, visitor);
  };

  const node = ts.forEachChild(src, visitor);
  if (!node || !callback(node)) {
    throw new Error('Could not find node.');
  }
  return node;
}

function assertNode(actual: ts.Node, expected: string) {
  const fixedExpected = getTextWithoutIdentation(expected).trim();
  const actualAsString =
      ts.createPrinter().printNode(ts.EmitHint.Unspecified, actual, ts.getOriginalNode(actual).getSourceFile());

  assert.strictEqual(actualAsString.trim(), fixedExpected);
}


describe('JSDoc to TS migration', () => {
  describe('removeUnusedJSDocTagsFromNode', () => {
    it('should delete jsDoc tags that have been moved', () => {
      const node = getNodeFromString(`
      /**
       * Test Comment Line
       * @param {string} x
       * @param {string} z
       */
      function test(x) { }
    `);

      const jsDocTag = ts.getJSDocTags(node);
      removeUnusedJSDocTagsFromNode(node, jsDocTag);

      assertNode(node, `
      /**
       * Test Comment Line
       */
      function test(x) { }
    `);
    });

    it('should remove the comment all together if it becomes empty', () => {
      const node = getNodeFromString(`
      /**
       * @param {string} x
       */
      function test(x) { }
    `);

      const jsDocTag = ts.getJSDocTags(node);
      removeUnusedJSDocTagsFromNode(node, jsDocTag);

      assertNode(node, `
      function test(x) { }
    `);
    });

    it('should be aware of previous invocations', () => {
      const node = getNodeFromString(`
      /**
       * @param {string} x
       * @return {number}
       */
      function test(x) { }
    `);

      const jsDocTags = ts.getJSDocTags(node);
      removeUnusedJSDocTagsFromNode(node, jsDocTags[0]);
      removeUnusedJSDocTagsFromNode(node, jsDocTags[1]);

      assertNode(node, `
      function test(x) { }
    `);
    });

    it('should not care about the order in which tags are removed', () => {
      const node = getNodeFromString(`
      /**
       * @param {string} x
       * @return {number}
       */
      function test(x) { }
    `);

      const jsDocTags = ts.getJSDocTags(node);
      removeUnusedJSDocTagsFromNode(node, jsDocTags[1]);
      removeUnusedJSDocTagsFromNode(node, jsDocTags[0]);

      assertNode(node, `
      function test(x) { }
    `);
    });
  });

  describe('updateReturnType', () => {
    it('should add the return type for functions', () => {
      const result = transform(
          `
        /**
         * @return {string}
         */
        function test() { }
      `,
          [updateReturnType]);

      assertNode(result, `
      function test(): string { }
      `);
    });

    it('should add the return type for arrow functions', () => {
      const result = transform(
          `
        /**
         * @return {string}
         */
        const test = () => { };
      `,
          [updateReturnType]);

      assertNode(result, `
        const test = (): string => { };
      `);
    });

    it('should add the return type for method declarations', () => {
      const result = transform(
          `
        class Test {
          /**
           * @return {string}
           */
          test() {}
        }
      `,
          [updateReturnType]);

      assertNode(result, `
        class Test {
            test(): string { }
        }
      `);
    });

    it('should handle jsDoc ! types', () => {
      const result = transform(
          `
        class Test {}
        /**
         * @return {!Test}
         */
        function test() { }
      `,
          [updateReturnType]);

      assertNode(result, `
        class Test {
        }
        function test(): Test { }
      `);
    });
  });

  describe('updateParameters', () => {
    it('should add type information for parameters of function declarations', () => {
      const result = transform(
          `
        /**
         * @param {string} x
         * @param {number} y
         */
        function test(x, y) { }
      `,
          [updateParameters]);

      assertNode(result, `
        function test(x: string, y: number) { }
      `);
    });

    it('remove undefined from optional types with initializers', () => {
      const result = transform(
          `
        /**
         * @param {string=} x
         */
        function test(x = '1') { }
      `,
          [updateParameters]);

      assertNode(result, `
        function test(x: string = '1') { }
      `);
    });

    it('should add type information for parameters of arrow functions', () => {
      const result = transform(
          `
        /**
         * @param {string} x
         * @param {number} y
         */
        const test = (x, y) => { }
      `,
          [updateParameters]);

      assertNode(result, `
        const test = (x: string, y: number) => { };
      `);
    });

    it('should add type information for parameters of method declarations', () => {
      const result = transform(
          `
        class Test {
          /**
           * @param {string} x
           * @param {number} y
           */
          test(x, y) { }
        }
      `,
          [updateParameters]);

      assertNode(result, `
        class Test {
            test(x: string, y: number) { }
        }
      `);
    });

    it('should add type information for parameters of constructor declarations', () => {
      const result = transform(
          `
        class Test {
          /**
           * @param {string} x
           * @param {number} y
           */
          constructor(x, y) { }
        }
      `,
          [updateParameters]);

      assertNode(result, `
        class Test {
            constructor(x: string, y: number) { }
        }
      `);
    });

    it('should handle ! types', () => {
      const result = transform(
          `
        class Test {}
        /**
         * @param {!Test} x
         */
        function test(x) { }
      `,
          [updateParameters]);

      assertNode(result, `
        class Test {
        }
        function test(x: Test) { }
      `);
    });

    it('should handle optional parameters', () => {
      const result = transform(
          `
        /**
         * @param {number=} x
         */
        function test(x) { }
      `,
          [updateParameters]);

      assertNode(result, `
        function test(x?: number) { }
      `);
    });
  });

  describe('updateCast', () => {
    it('should change a jsDoc cast to a TypeScript cast', () => {
      const result = transform(
          `
        const test = /** @type {number} */('1');
      `,
          [updateCast]);

      assertNode(result, `
        const test = ('1' as number);
      `);
    });

    it('should handle nested casts', () => {
      const result = transform(
          `
        class HTMLInputElement {}
        const enabled = /** @type {!HTMLInputElement} */ (event.target).checked;
      `,
          [updateCast]);

      assertNode(result, `
        class HTMLInputElement {
        }
        const enabled = (event.target as HTMLInputElement).checked;
      `);
    });

    it('should handle ! types', () => {
      const result = transform(
          `
        class Test { }
        const test = /** @type {!Test} */('1');
      `,
          [updateCast]);

      assertNode(result, `
        class Test {
        }
        const test = ('1' as Test);
      `);
    });
  });

  describe('updatePropertyDeclarations', () => {
    it('should declare properties on classes', () => {
      const result = transform(
          `
        class Test {
          constructor() {
            /** @type {string} */
            this._test = 'test';
          }
        }
      `,
          [updatePropertyDeclarations]);

      assertNode(result, `
        class Test {
            _test: string;
            constructor() {
                this._test = 'test';
            }
        }
      `);
    });

    it('should not declare inherited properties', () => {
      const result = transform(
          `
        class Base {
          test: number;
        }

        class Test extends Base {

        }
      `,
          [updatePropertyDeclarations]);

      assertNode(result, `
        class Base {
            test: number;
        }
        class Test extends Base {
        }
      `);
    });

    it('should remove jsDoc only declarations', () => {
      const result = transform(
          `
        class Test {
          constructor() {
            /** @type {number} */
            this._test;
          }
        }
      `,
          [updatePropertyDeclarations]);

      assertNode(result, `
        class Test {
            _test: number;
            constructor() {
            }
        }
      `);
    });

    it('should add undefined to declarations that don\'t happen in the constructor', () => {
      const result = transform(
          `
        class Test {
          constructor() {
          }

          test() {
            this._test = '123';
          }
        }
      `,
          [
            updatePropertyDeclarations,
          ]);

      assertNode(result, `
        class Test {
            _test: string | undefined;
            constructor() {
            }
            test() {
                this._test = '123';
            }
        }
      `);
    });

    it('should not add undefined twice to declarations that don\'t happen in the constructor', () => {
      const result = transform(
          `
        class Test {
          constructor() {
          }

          test() {
            this._test = '123' as number | undefined;
          }
        }
      `,
          [
            updatePropertyDeclarations,
          ]);

      assertNode(result, `
        class Test {
            _test: number | undefined;
            constructor() {
            }
            test() {
                this._test = '123' as number | undefined;
            }
        }
      `);
    });
  });

  describe('updateVariableDeclarations', () => {
    it('should update variable declarations', () => {
      const result = transform(
          `
          /** @type {string} */
          const test = 'test';
      `,
          [updateVariableDeclarations]);

      assertNode(result, `
        const test: string = 'test';
      `);
    });
  });

  describe('updateInterfacesImplementations', () => {
    it('should update @implements', () => {
      const result = transform(
          `
        class Base { }

        /**
         * @implements Base
         */
        class Test { }
      `,
          [updateInterfacesImplementations]);

      assertNode(result, `
        class Base {
        }
        class Test implements Base {
        }
      `);
    });

    it('should update multiple @implements', () => {
      const result = transform(
          `
        class Base1 { }
        class Base2 { }

        /**
         * @implements Base1
         * @implements Base2
         */
        class Test { }
      `,
          [updateInterfacesImplementations]);

      assertNode(result, `
        class Base1 {
        }
        class Base2 {
        }
        class Test implements Base1, Base2 {
        }
      `);
    });
  });

  describe('updateInterfacesDeclarations', () => {
    it('should update @interface', () => {
      const result = transform(
          `
        /**
         * @interface
         */
        class Test {
          test(x: string): number { throw new Error(); }
        }
      `,
          [updateInterfaceDeclarations]);

      assertNode(result, `
        interface Test {
            test(x: string): number;
        }
      `);
    });
  });

  describe('updateGenericsInSuperClass', () => {
    it('should update generics when extending classes', () => {
      const result = transform(
          `
        /**
         * @template NODE_TYPE
         */
        class Base { }

        /**
         * @extends Base<string>
         */
        class Test extends Base { }
      `,
          [updateGenericsInSuperClass]);

      assertNode(result, `
        /**
         * @template NODE_TYPE
         */
        class Base {
        }
        class Test extends Base<string> {
        }
      `);
    });

    it('should handle jsDoc types correctly', () => {
      const result = transform(
          `
        class Test2 { }
        /**
         * @template NODE_TYPE
         */
        class Base { }

        /**
         * @extends Base<!Test2>
         */
        class Test extends Base { }
      `,
          [updateGenericsInSuperClass]);

      assertNode(result, `
        class Test2 {
        }
        /**
         * @template NODE_TYPE
         */
        class Base {
        }
        class Test extends Base<Test2> {
        }
      `);
    });
  });

  describe('updateThisDeclaration', () => {
    it('should update @this declarations for functions', () => {
      const result = transform(
          `
        /**
         * @this number
         */
        function test() {}
      `,
          [updateThisDeclaration]);

      assertNode(result, `
        function test(this: number) { }
      `);
    });

    it('should update @this declarations for arrow functions', () => {
      const result = transform(
          `
        /**
         * @this number
         */
        const test = () => { }
      `,
          [updateThisDeclaration]);


      assertNode(result, `
        const test = (this: number) => { };
      `);
    });
  });

  describe('updateTypeDefinitionsForLocalTypes', () => {
    it('should add the correct type', () => {
      const result = transform(
          `
        function test() {
          let x = null;
          x = '123';
        }
      `,
          [updateTypeDefinitionsForLocalTypes]);

      assertNode(result, `
        function test() {
            let x: '123' | null = null;
            x = '123';
        }
      `);
    });
  });

  describe('updateTypedef', () => {
    it('should translate typedefs to interfaces', () => {
      const result = transform(
          `
          /**
           * @typedef {{
           *  iconName: string,
           *  rotate: number,
           *  scaleX: number,
           *  scaleY: number,
           * }}
           */
          // @ts-ignore typedef
          export let IconInfo;
      `,
          [updateTypedefs]);

      assertNode(result, `
        export interface IconInfo {
            iconName: string;
            rotate: number;
            scaleX: number;
            scaleY: number;
        }
      `);
    });

    it('should translate mark undefined fields as optional', () => {
      const result = transform(
          `
          class Test1 { }
          class Test2 { }
          /**
           * @typedef {{
           *  test: string,
           *  iconName1: (!Test1|Test2|undefined),
           *  iconName2: (!Test1|Test2),
           *  test2: number,
           * }}
           */
          // @ts-ignore typedef
          export let IconInfo;
      `,
          [updateTypedefs]);

      assertNode(result, `
        export interface IconInfo {
            iconName?: string;
        }
      `);
    });
  });

  describe('updateOverrides', () => {
    it('should remove @override directives', () => {
      const result = transform(
          `
          class Test {
            /**
             * @override
             */
            test() {}
          }
      `,
          [updateOverrides]);

      assertNode(result, `
        class Test {
            test() { }
        }
      `);
    });
  });

  describe('updateEnums', () => {
    it('should translate enums', () => {
      const result = transform(
          `
          /** @enum {string} */
          const Enum = {
            Test: 'test',
          };
      `,
          [updateEnums]);

      assertNode(result, `
        const enum Enum {
            Test = 'test'
        };
      `);
    });

    it('should translate enums with symbols to strings', () => {
      const result = transform(
          `
          /** @enum {string} */
          const Enum = {
            Test: Symbol('test'),
          };
      `,
          [updateEnums]);

      assertNode(result, `
        const enum Enum {
            Test = 'test'
        };
      `);
    });
  });

  describe('updateMissingGenericsInMaps', () => {
    it('should update missing generic types maps', () => {
      const result = transform(
          `
        function a() {
          const test = new Map();
          test.set('test', 123);
        }
      `,
          [updateMissingGenericsInMaps]);

      assertNode(result, `
        function a() {
            const test = new Map<'test', 123>();
            test.set('test', 123);
        }
      `);
    });
  });

  describe('updateMissingGenericsInSets', () => {
    it('should update missing generic types in sets', () => {
      const result = transform(
          `
        function a() {
          const test = new Set();
          test.add('test');
        }
      `,
          [updateMissingGenericsInSets]);

      assertNode(result, `
        function a() {
            const test = new Set<'test'>();
            test.add('test');
        }
      `);
    });
  });

  describe('transform', () => {
    it('should apply all given transformations', () => {
      const result = transform(
          `
        /**
         * @template NODE_TYPE
         */
        class Base { }

        /**
         * @extends Base<string>
         */
        class Test extends Base {
          /**
           * @param {number} x
           */
          constructor(x) {
            /** @type {string} */
            this._y = 'test';

            this.x = /** @type {number} */('test');
            let z = null;
            z = '123';
          }

          /**
           * @return {number}
           */
          test() {
            /**
             * @this {Test}
             */
            const test = () => {};
            test();
          }
        }
      `,
          [
            updateReturnType,
            updateParameters,
            updateCast,
            updatePropertyDeclarations,
            updateGenericsInSuperClass,
            updateThisDeclaration,
            updateTypeDefinitionsForLocalTypes,
            updateEnums,
          ]);

      assertNode(result, `
        /**
         * @template NODE_TYPE
         */
        class Base {
        }
        class Test extends Base<string> {
            _y: string;
            x: number;
            constructor(x: number) {
                this._y = 'test';
                this.x = ('test' as number);
                let z: '123' | null = null;
                z = '123';
            }
            test(): number {
                const test = (this: Test) => { };
                test();
            }
        }
      `);
    });
  });

  describe.only('Transform a folder', function() {
    this.timeout(0);

    it('should transform enums in the ElementsTreeElement.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache, [
        updateEnums,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent =
          readFileSync(__dirname + '/1_updateEnums/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform enums in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('webauthn', true, cache, [
        updateEnums,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/WebauthnPane.js');
      const expectedContent = readFileSync(__dirname + '/1_updateEnums/webauthn/WebauthnPane.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform typedefs in the ElementsTreeElement.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache, [
        updateEnums,
        updateTypedefs,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent =
          readFileSync(__dirname + '/2_updateTypedefs/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform overrides in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent =
          readFileSync(__dirname + '/3_updateOverrides/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform overrides in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('webauthn', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/WebauthnPane.js');
      const expectedContent =
          readFileSync(__dirname + '/3_updateOverrides/webauthn/WebauthnPane.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform variable declarations in the ElementsTreeElement.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
        updateVariableDeclarations,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent =
          readFileSync(__dirname + '/4_updateVariableDeclarations/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it('should transform variable declarations in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('webauthn', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
        updateVariableDeclarations,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/WebauthnPane.js');
      const expectedContent =
          readFileSync(__dirname + '/4_updateVariableDeclarations/webauthn/WebauthnPane.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it.skip('should transform return types in the ElementsTreeElement.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
        updateVariableDeclarations,
        updateReturnType,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent =
          readFileSync(__dirname + '/5_updateReturnType/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it.skip('should transform variable declarations in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('webauthn', true, cache, [
        updateEnums,
        updateTypedefs,
        updateOverrides,
        updateVariableDeclarations,
        updateReturnType,
      ]);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/WebauthnPane.js');
      const expectedContent =
          readFileSync(__dirname + '/5_updateReturnType/webauthn/WebauthnPane.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it.skip('should transform ElementsTreeElement.js file', () => {
      const cache = new Map<string, string>();
      transformModule('elements', true, cache);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/ElementsTreeElement.js');
      const expectedContent = readFileSync(__dirname + '/all/elements/ElementsTreeElement.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });

    it.only('should transform variable declarations in the WebauthnPane.js file', () => {
      const cache = new Map<string, string>();
      transformModule('webauthn', true, cache);
      // updateExtensionsAndReferences('webauthn');

      const actualContent = cache.get('/WebauthnPane.js');
      const expectedContent = readFileSync(__dirname + '/all/webauthn/WebauthnPane.ts', {encoding: 'utf8'});

      assert.strictEqual(actualContent, expectedContent);
    });
  });
});
