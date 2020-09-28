import * as ts from 'typescript';
export declare const nodeIsPrimitive: (node: ts.TypeNode) => boolean;
export declare const valueForTypeNode: (node: ts.TypeNode, isFunctionParam?: boolean) => string;
