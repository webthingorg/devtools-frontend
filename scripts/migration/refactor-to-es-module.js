"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const recast_1 = require("recast");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const readFile = util_1.promisify(fs_1.default.readFile);
const writeFile = util_1.promisify(fs_1.default.writeFile);
const FRONT_END_FOLDER = path_1.default.join(__dirname, '..', '..', 'front_end');
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
const b = recast_1.types.builders;
function createReplacementDeclaration(propertyName, declaration) {
    if (declaration.type === 'ClassExpression') {
        return b.exportDeclaration(false, b.classDeclaration(propertyName, declaration.body));
    }
    if (declaration.type === 'Literal') {
        return b.exportNamedDeclaration(b.variableDeclaration("const", [b.variableDeclarator(propertyName, declaration)]));
    }
    if (declaration.type === 'ObjectExpression') {
        return b.exportNamedDeclaration(b.variableDeclaration("const", [b.variableDeclarator(propertyName, declaration)]));
    }
    console.error(`Unable to refactor declaration of type "${declaration.type}"`);
}
function getTopLevelMemberExpression(expression) {
    while (expression.object.type === 'MemberExpression') {
        expression = expression.object;
    }
    return expression;
}
function rewriteSource(source, refactoringNamespace, refactoringFileName) {
    const exportedMembers = [];
    let needToObjectAssign = false;
    const ast = recast_1.parse(source);
    ast.program.body = ast.program.body.map((expression) => {
        if (expression.type === 'ExpressionStatement') {
            if (expression.expression.type === 'AssignmentExpression') {
                const assignment = expression.expression;
                if (assignment.left.type === 'MemberExpression') {
                    const topLevelAssignment = getTopLevelMemberExpression(assignment.left);
                    // If there is a nested export, such as `UI.ARIAUtils.Nested.Field`
                    if (topLevelAssignment !== assignment.left.object) {
                        // Exports itself. E.g. `UI.ARIAUtils = <...>`
                        if (assignment.left.object.name === refactoringNamespace && assignment.left.property.name === refactoringFileName) {
                            const { declaration } = createReplacementDeclaration(assignment.left.property, assignment.right);
                            const declarationStatement = b.exportDefaultDeclaration(declaration);
                            declarationStatement.comments = expression.comments;
                            if (needToObjectAssign) {
                                console.error(`Multiple exports with the same name is invalid!`);
                            }
                            needToObjectAssign = true;
                            return declarationStatement;
                        }
                        console.error(`Nested field "${assignment.left.property.name}" detected! Requires manual changes.`);
                        return expression;
                    }
                    const propertyName = assignment.left.property;
                    const { object, property } = topLevelAssignment;
                    if (object.type === 'Identifier' && property.type === 'Identifier') {
                        const namespace = object.name;
                        const fileName = property.name;
                        if (namespace === refactoringNamespace && fileName === refactoringFileName) {
                            const declaration = createReplacementDeclaration(propertyName, assignment.right);
                            if (declaration) {
                                exportedMembers.push(propertyName);
                                declaration.comments = expression.comments;
                                return declaration;
                            }
                        }
                    }
                }
            }
        }
        return expression;
    });
    // self.UI = self.UI || {};
    const legacyNamespaceName = b.memberExpression(b.identifier('self'), b.identifier(refactoringNamespace), false);
    const legacyNamespaceOr = b.logicalExpression("||", legacyNamespaceName, b.objectExpression([]));
    ast.program.body.push(b.expressionStatement.from({ expression: b.assignmentExpression('=', legacyNamespaceName, legacyNamespaceOr), comments: [b.commentBlock('Legacy exported object', true, false)] }));
    // self.UI.ARIAUtils = {properties};
    const legacyNamespaceExport = b.memberExpression(b.identifier('self'), b.memberExpression(b.identifier(refactoringNamespace), b.identifier(refactoringFileName), false), false);
    let exportedObjectProperties = b.objectExpression(exportedMembers.map(prop => b.objectProperty.from({ key: prop, value: prop, shorthand: true })));
    if (needToObjectAssign) {
        exportedObjectProperties = b.callExpression(b.memberExpression(b.identifier('Object'), b.identifier('assign'), false), [b.identifier(refactoringFileName), exportedObjectProperties]);
    }
    ast.program.body.push(b.expressionStatement(b.assignmentExpression('=', legacyNamespaceExport, exportedObjectProperties)));
    return recast_1.print(ast).code;
}
async function main(refactoringNamespace, refactoringFileName) {
    const pathName = path_1.default.join(FRONT_END_FOLDER, refactoringNamespace, `${refactoringFileName}.js`);
    const source = await readFile(pathName, { encoding: 'utf-8' });
    const rewrittenSource = rewriteSource(source, capitalizeFirstLetter(process.argv[2]), refactoringFileName);
    await writeFile(pathName, rewrittenSource);
    console.log(`Succesfully written source to "${pathName}". Make sure that no other errors are reported before submitting!`);
}
main(process.argv[2], process.argv[3]);
