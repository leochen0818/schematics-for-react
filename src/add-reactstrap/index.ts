import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';

export default function (_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {

    const packageFileName = '/package.json';
    
    if ( !tree.exists(packageFileName) ) {
      throw new SchematicsException(`'package.json' doesn't exist.`);
    }

    const sourceText = tree.read(packageFileName)!.toString('utf-8');
    const json = JSON.parse(sourceText);

    if ( !json.dependencies ) {
      json.dependencies = {};
    }

    const packages = ['bootstrap', 'reactstrap', '@types/reactstrap'];
    packages.forEach((packageName) => {

      if ( !json.dependencies[packageName] ) {
        json.dependencies[packageName] = '*';
        json.dependencies = sortObjectByKeys(json.dependencies);
      }

      tree.overwrite('/package.json', JSON.stringify(json, null, 2));

    });

    _context.addTask(
      new NodePackageInstallTask({
        packageName: packages.join(' ')
      })
    );

    const indexTsxFileName = '/src/index.tsx';

    if ( !tree.exists(indexTsxFileName) ) {
      throw new SchematicsException(`'/src/index.tsx' doesn't exist.`);
    }
    
    const indexTsxAst = tsquery.ast(tree.read(indexTsxFileName)!.toString(), '', ts.ScriptKind.TSX);
    const lastImportDeclaration = tsquery(indexTsxAst, 'ImportDeclaration').pop()! as ts.ImportDeclaration;
    
    const indexTsxRecorder = tree.beginUpdate(indexTsxFileName);
    indexTsxRecorder.insertLeft(lastImportDeclaration.end, `\nimport 'bootstrap/dist/css/bootstrap.min.css';`);
    tree.commitUpdate(indexTsxRecorder);

    const appTsxFileName = '/src/App.tsx';

    if ( !tree.exists(appTsxFileName) ) {
      throw new SchematicsException(`'/src/App.tsx' doesn't exist.`);
    }
    
    const appTsxAst = tsquery.ast(tree.read(appTsxFileName)!.toString(), '', ts.ScriptKind.TSX);
    const appLastImportDeclaration = tsquery(appTsxAst, 'ImportDeclaration').pop()! as ts.ImportDeclaration;
    const jsxClosingElement = tsquery(appTsxAst, 'VariableDeclaration[name.name="App"] JsxClosingElement[tagName.escapedText="a"]').pop()! as ts.JsxClosingElement;
    let toInsert = `\n        <Alert color="success">reactstrap installed successfully!`;
    toInsert += `\n          <span role="img" aria-label="hooray">?</span>`;
    toInsert += `\n        <\/Alert>`;

    const appTsxRecorder = tree.beginUpdate(appTsxFileName);
    appTsxRecorder.insertLeft(appLastImportDeclaration.end, `\nimport { Alert } from 'reactstrap';`);
    appTsxRecorder.insertLeft(jsxClosingElement.end, toInsert);
    tree.commitUpdate(appTsxRecorder);

    return tree;
  };
}

function sortObjectByKeys(obj: any): object {
  return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {} as any);
}
