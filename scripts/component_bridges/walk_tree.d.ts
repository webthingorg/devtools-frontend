import * as ts from 'typescript';
interface ExternalImport {
    namedImports: Set<string>;
    filePath: string;
}
interface NamespaceImport {
    filePath: string;
    namespace: string;
}
export interface WalkerState {
    foundInterfaces: Set<ts.InterfaceDeclaration | ts.TypeAliasDeclaration>;
    foundEnums: Set<ts.EnumDeclaration>;
    typeReferencesToConvert: Set<string>;
    componentClass?: ts.ClassDeclaration;
    publicMethods: Set<ts.MethodDeclaration>;
    customElementsDefineCall?: ts.ExpressionStatement;
    legacyInterfaceReferences: Set<'common'>;
    imports: Set<ExternalImport | NamespaceImport>;
    getters: Set<ts.GetAccessorDeclaration>;
    setters: Set<ts.SetAccessorDeclaration>;
}
export declare const nodeIsReadOnlyInterfaceReference: (node: ts.Node) => node is ts.TypeReferenceNode;
export declare const nodeIsReadOnlyArrayInterfaceReference: (node: ts.Node) => node is ts.TypeReferenceNode;
export declare const filePathToTypeScriptSourceFile: (filePath: string) => ts.SourceFile;
export declare const walkTree: (startNode: ts.SourceFile, resolvedFilePath: string) => WalkerState;
export {};
