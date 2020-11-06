const ts = require('typescript');
const path = require('path');
const fs = require('fs');

process.chdir('./out/Default');

const tmp = ts.sys;
const originalReadFile = ts.sys.readFile;
function readFile(path, encoding) {
  const data = originalReadFile(path, encoding);
  if (!data)
    return undefined;

  // Add an // @empty-line comment to empty lines to make sure TypeScript does
  // not loose them while processing the file.
  return data.replace(/\n\n/g, '\n// @empty-line\n');
}
tmp.readFile = readFile;

function updateModule(module) {
  const basePath = path.resolve('../../front_end', module);
  const configFileName = `./gen/front_end/${module}/${module}-tsconfig.json`;

  if (!fs.existsSync(configFileName))
    return;

  // Fix after https://github.com/Microsoft/TypeScript/issues/18217
  tmp.onUnRecoverableConfigFileDiagnostic = err => {
    throw err
  };
  const config = ts.getParsedCommandLineOfConfigFile(configFileName, undefined, tmp);
  tmp.onUnRecoverableConfigFileDiagnostic = undefined;

  const host = ts.createCompilerHost(config.options, true);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    projectReferences: config.projectReferences,
    host: host,
  });


  const checker = program.getTypeChecker();

  const transformer = context => {
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

      function updateComments(jsDocTagsToRemove, node) {
        const jsDoc = (node.original || node).jsDoc;
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

          let newComment = text;
          for (const jsDocTag of jsDocTagsToRemove) {
            // Remove the jsDoc tags that we already inlined.
            newComment = newComment.replace(jsDocTag.getFullText(), '');
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
        if (ts.isPropertyAssignment(node) && ts.hasJSDocParameterTags(node) &&
            ts.isFunctionExpression(node.initializer)) {
          const parameters = updateParameters(node.initializer.parameters, jsDocTagsToRemove);
          return updateComments(
              jsDocTagsToRemove,
              context.factory.updatePropertyAssignment(
                  node, node.name,
                  context.factory.updateFunctionExpression(
                      node.initializer, node.initializer.modifiers, node.initializer.asteriskToken,
                      node.initializer.name, node.initializer.typeParameters, parameters, node.initializer.type,
                      node.initializer.body)));
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  const sources = program.getSourceFiles().filter(sourceFile => sourceFile.fileName.startsWith(basePath));

  const result = ts.transformNodes(undefined, host, ts.factory, config.compilerOptions, sources, [transformer], false);

  const printer = ts.createPrinter();
  for (const sourceFile of result.transformed) {
    // Replace // @empty-line comments with actual empty lines again
    const content = printer.printFile(sourceFile).replace(/\n\s*\/\/ @empty-line\n/g, '\n\n');
    fs.writeFileSync(sourceFile.fileName, content);
  }
}

const blacklistedModules = new Set(['cm', 'cm_headless']);

function walkAllModules() {
  const entries = fs.readdirSync('./gen/front_end', {withFileTypes: true});
  for (const entry of entries) {
    if (!entry.isDirectory())
      continue;
    if (blacklistedModules.has(entry.name))
      continue;

    updateModule(entry.name);
  }
}

updateModule('diff');

// walkAllModules();
