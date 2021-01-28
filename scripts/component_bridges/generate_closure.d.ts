import { WalkerState } from './walk_tree.js';
export declare const generateCreatorFunction: (state: WalkerState) => string[];
export declare const generateClosureClass: (state: WalkerState) => string[];
export declare const generateTypeReferences: (state: WalkerState) => Array<string[]>;
export declare const generateImports: (state: WalkerState) => string[];
export interface GeneratedCode {
    types: string[][];
    closureClass: string[];
    creatorFunction: string[];
    moduleImports: string[];
}
export declare const generateClosureBridge: (state: WalkerState) => GeneratedCode;
