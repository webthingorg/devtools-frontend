import * as ts from 'typescript';
import { WalkerState } from './walk_tree.js';
export declare const findNodeForTypeReferenceName: (state: WalkerState, typeReferenceName: string) => ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration | null;
