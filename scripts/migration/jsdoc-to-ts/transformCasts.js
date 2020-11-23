const ts = require('typescript');

const printer = ts.createPrinter();

module.exports = (checker) => {
  return context => {
    return sourceFile => {
      const p = node => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
      const visitor = (node) => {
        if (ts.isVariableDeclaration(node) && node.initializer && ts.isParenthesizedExpression(node.initializer)) {
          const type = checker.getTypeAtLocation(node);
          const typeNode = checker.typeToTypeNode(type, node)
          ts.addEmitFlags(node.parent.parent, ts.EmitFlags.NoLeadingComments);
          ts.addEmitFlags(node.parent, ts.EmitFlags.NoLeadingComments);
          ts.addEmitFlags(node, ts.EmitFlags.NoLeadingComments);

          if (typeNode && ts.isCallExpression(node.initializer.expression)) {
            ts.addEmitFlags(node.initializer, ts.EmitFlags.NoLeadingComments);
            ts.addEmitFlags(node.initializer.expression, ts.EmitFlags.NoLeadingComments);
            return context.factory.createVariableDeclaration(
                node.name, node.exclamationToken, node.type,
                context.factory.createAsExpression(node.initializer.expression.expression, typeNode));
          } else {
            return context.factory.updateVariableDeclaration(
                node, node.name, node.exclamationToken, typeNode, node.initializer.expression);
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}
