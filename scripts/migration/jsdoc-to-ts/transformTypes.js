const ts = require('typescript');

module.exports = (checker) => {
  return context => {
    return sourceFile => {
      const nodesToRemove = new Set();
      const typeDeclarations = new Map();
      const namedDeclarations = sourceFile.getNamedDeclarations();
      for (const [name, [node]] of namedDeclarations.entries()) {
        const jsDocTags = ts.getJSDocTags(node);
        const typeDefTag = jsDocTags.find(t => ts.isJSDocTypedefTag(t));
        if (typeDefTag) {
          const type = checker.getTypeAtLocation(typeDefTag);
          console.log(name, checker.typeToString(type, sourceFile));
          typeDeclarations.set(name, type);
          let curr = node;
          while (curr && curr.parent !== sourceFile) {
            curr = curr.parent;
          }
          nodesToRemove.add(curr);
        }
      }

      const statements = sourceFile.statements.filter(node => !nodesToRemove.has(node));
      const typeDeclarationsToAdd = [];
      for (const [identifier, type] of typeDeclarations.entries()) {
        const typeAlias = context.factory.createTypeAliasDeclaration(
            [], [], identifier, [], checker.typeToTypeNode(type, sourceFile));
        typeDeclarationsToAdd.push(typeAlias);
      }

      statements.splice(1, 0, ...typeDeclarationsToAdd);
      return context.factory.updateSourceFile(
          sourceFile,
          statements,
      )
    }
  }
}
