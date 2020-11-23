const ts = require('typescript');


module.exports = (checker) => {
  return context => {
    return sourceFile => {
      const classDeclarations = [];
      ts.forEachChild(sourceFile, (node) => {
        if (!ts.isClassDeclaration(node))
          return;
        classDeclarations.push(node);
      });

      const declarationsToFix = new Map();
      for (const classDeclaration of classDeclarations) {
        const type = checker.getTypeAtLocation(classDeclaration);

        const baseTypes = checker.getBaseTypes(type);
        const parentProperties = new Set(baseTypes[0].getApparentProperties().map(p => p.valueDeclaration));
        const ownProperties = type.getApparentProperties()
                                  .filter(p => !parentProperties.has(p.valueDeclaration))
                                  .filter(symbol => symbol.flags & ts.SymbolFlags.Property);

        if (ownProperties.length) {
          declarationsToFix.set(classDeclaration, ownProperties);
        }
      }

      const visitor = (node) => {
        if (declarationsToFix.has(node)) {
          const members = [];

          for (const property of declarationsToFix.get(node)) {
            const declarations = property.getDeclarations();
            const types = declarations.map(d => checker.getTypeAtLocation(d)).filter((t, i, a) => a.indexOf(t) === i);
            const typeNodes = types.map(t => checker.typeToTypeNode(t, node));
            const typeNode = context.factory.createUnionTypeNode(typeNodes);
            const modifiers = [];
            let name = property.name;
            if (name.startsWith('_')) {
              modifiers.push(context.factory.createModifier(ts.SyntaxKind.PrivateKeyword));
              // name = name.slice(1);
            } else {
              modifiers.push(context.factory.createModifier(ts.SyntaxKind.PrivateKeyword));
            }
            members.push(context.factory.createPropertyDeclaration([], modifiers, name, null, typeNode, null))
          }

          members.push(...node.members);
          return context.factory.updateClassDeclaration(
              node,
              node.declarationsToFix,
              node.modifiers,
              node.name,
              node.typeParameters,
              node.heritageClauses,
              members,
          );
        }
        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}
