// @ts-nocheck

const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const readFile = promisify(fs.readFile);

function matchForStaticUsage({node, sourceFile}) {
  const nodeStart = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const nodeEnd = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    cooked: node.template.text,
    code: node.getFullText().trim(),
    loc: {
      start: {
        line: nodeStart.line,
        column: nodeStart.character,
      },
      end: {
        line: nodeEnd.line,
        column: nodeEnd.character,
      },
    },
    parsedArguments: [],
  };
}

function matchForDynamicUsage({node, sourceFile}) {
  const nodeStart = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const nodeEnd = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  const printer = ts.createPrinter();

  const parsedArguments = node.template.templateSpans.map(span => {
    return printer.printNode(ts.EmitHint.Unspecified, span.expression, sourceFile);
  });

  let cookedText = node.template.head.text;

  node.template.templateSpans.forEach(span => {
    cookedText += '%s';
    cookedText += span.literal.text;
  });


  return {
    cooked: cookedText,
    code: node.getFullText().trim(),
    loc: {
      start: {
        line: nodeStart.line,
        column: nodeStart.character,
      },
      end: {
        line: nodeEnd.line,
        column: nodeEnd.character,
      },
    },
    parsedArguments,
  };
}

function processUsage({node, sourceFile}) {
  if (node.template.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
    return matchForStaticUsage({node, sourceFile});
  }

  return matchForDynamicUsage({node, sourceFile});
}

function walkTree({node, foundUsages, sourceFile}) {
  switch (node.kind) {
    case ts.SyntaxKind.TaggedTemplateExpression: {
      const tag = node.tag.escapedText;
      if (tag === 'ls') {
        const newUsage = processUsage({node, sourceFile});
        foundUsages.push(newUsage);
        break;
      }
    }
  }

  node.forEachChild(child => {
    walkTree({node: child, foundUsages, sourceFile});
  });
}

async function parseLocalizableStringFromTypeScriptFile(filePath) {
  if (filePath.endsWith('.d.ts')) {
    return [];
  }

  const sourceCode = await readFile(filePath, {encoding: 'utf8'});
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.ESNext, true);

  const foundUsages = [];

  walkTree({
    node: sourceFile,
    foundUsages,
    sourceFile,
  });

  foundUsages.forEach(usage => {
    usage.filePath = path.resolve(filePath);
  });

  return foundUsages;
}

module.exports = {parseLocalizableStringFromTypeScriptFile};
