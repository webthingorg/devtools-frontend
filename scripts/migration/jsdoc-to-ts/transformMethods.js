const ts = require('typescript');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = (checker) => {
  return context => {
    return sourceFile => {
      function updateParameters(parameters, jsDocTagsToRemove) {
        return parameters.map(parameter => {
          if (parameter.type) {
            return parameter;
          }
          const type = checker.getTypeAtLocation(parameter);
          const typeNode =
              checker.typeToTypeNode(type, parameter, ts.NodeBuilderFlags.AllowQualifedNameInPlaceOfIdentifier);

          jsDocTagsToRemove.push(...ts.getJSDocParameterTags(parameter));
          return context.factory.updateParameterDeclaration(
              parameter, parameter.decorators, parameter.modifiers, parameter.dotDotDotToken, parameter.name,
              parameter.questionToken, typeNode, parameter.initializer);
        });
      }

      function updateReturnTypeForFunction(jsDocTagsToRemove, node) {
        if (node.type)
          return node;
        const signature = checker.getSignatureFromDeclaration(node);
        const type = checker.getReturnTypeOfSignature(signature);

        const typeNode = checker.typeToTypeNode(type, sourceFile);

        jsDocTagsToRemove.push(ts.getJSDocReturnTag(node.original || node));
        return context.factory.updateFunctionExpression(
            node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, typeNode,
            node.body);
      }

      function updateReturnTypeForMethod(jsDocTagsToRemove, node) {
        if (node.type)
          return node;
        const signature = checker.getSignatureFromDeclaration(node);
        const type = checker.getReturnTypeOfSignature(signature);

        const typeNode = checker.typeToTypeNode(type, sourceFile);

        const jsDocTagToRemove = ts.getJSDocReturnTag(node.original || node);
        if (jsDocTagToRemove) {
          jsDocTagsToRemove.push(jsDocTagToRemove);
        }
        return context.factory.updateMethodDeclaration(
            node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken,
            node.typeParameters, node.parameters, typeNode, node.body);
      }

      function getOriginal(node) {
        let current = node;
        while (current.original) {
          current = current.original;
        }
        return current;
      }

      function updateComments(jsDocTagsToRemove, node) {
        const jsDoc = getOriginal(node).jsDoc;
        if (!jsDoc)
          return node;
        let newNode = node;
        // Make sure that ts skips the original comments.
        ts.addEmitFlags(node, ts.EmitFlags.NoLeadingComments);
        // Go through all comments and update jsDoc ones.
        for (const r of ts.getLeadingCommentRangesOfNode(node, sourceFile)) {
          // Get comment text and replace leading and ending comment characters (ts will add them again when printing).
          const text = sourceFile.getFullText().substring(r.pos, r.end).replace(/^\/\/|^\/\*|\*\/$/g, '');
          // Find the corresponding jsDoc comment.
          const jsDocComment = jsDoc.find(jsDocComment => jsDocComment.pos === r.pos && jsDocComment.end === r.end);
          if (!jsDocComment) {
            // If there is none, just append the comment again.
            newNode = ts.addSyntheticLeadingComment(newNode, r.kind, text, r.hasTrailingNewLine);
            continue;
          }

          let newComment = text.replace(/\s*\*\s*@override/, '');
          for (const jsDocTag of jsDocTagsToRemove) {
            // Remove the jsDoc tags that we already inlined.
            newComment = newComment.replace(
                new RegExp('\\s*\\*\\s*' + escapeRegExp(jsDocTag.getFullText().replace(/\s*\*\s*$/, ''))), '');
          }

          // Check if the comment would be empty after deleting all jsDoc tags.
          if (!newComment.match(/^[\*\s]*$/)) {
            newNode = ts.addSyntheticLeadingComment(newNode, r.kind, newComment, r.hasTrailingNewLine);
          }
        }

        return newNode;
      }

      const visitor = (node) => {
        const jsDocTagsToRemove = []

            // Process parameters in constructors.
            if (ts.isConstructorDeclaration(node) && ts.hasJSDocParameterTags(node)) {
          const parameters = updateParameters(node.parameters, jsDocTagsToRemove);

          return updateComments(
              jsDocTagsToRemove,
              context.factory.updateConstructorDeclaration(
                  node, node.decorators, node.modifiers, parameters, node.body));
        }
        // Process parameters in function assignments
        else if (
            ts.isPropertyAssignment(node) && ts.hasJSDocParameterTags(node) &&
            ts.isFunctionExpression(node.initializer)) {
          const parameters = updateParameters(node.initializer.parameters, jsDocTagsToRemove);

          return updateComments(
              jsDocTagsToRemove,
              context.factory.updatePropertyAssignment(
                  node, node.name,
                  updateReturnTypeForFunction(
                      jsDocTagsToRemove,
                      context.factory.updateFunctionExpression(
                          node.initializer, node.initializer.modifiers, node.initializer.asteriskToken,
                          node.initializer.name, node.initializer.typeParameters, parameters, node.initializer.type,
                          node.initializer.body))));
        }
        // Process parameters in methods
        else if (ts.isMethodDeclaration(node) && ts.hasJSDocParameterTags(node)) {
          const parameters = updateParameters(node.parameters, jsDocTagsToRemove);

          return updateComments(
              jsDocTagsToRemove,
              updateReturnTypeForMethod(
                  jsDocTagsToRemove,
                  context.factory.updateMethodDeclaration(
                      node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken,
                      node.typeParameters, parameters, node.type, node.body)));
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}
