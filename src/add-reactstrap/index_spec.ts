import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

import packageJson from './react-package.json';
import { reactIndexContent } from '../project-template/react-index';
import { reactAppContent } from '../project-template/react-app';

import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('add-reactstrap', () => {
  it('works', () => {
    const appTree = Tree.empty();
    appTree.create('./package.json', JSON.stringify(packageJson));
    appTree.create('./src/index.tsx', reactIndexContent);
    appTree.create('./src/App.tsx', reactAppContent);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-reactstrap', {}, appTree);

    const mainContent = tree.readContent('/src/index.tsx');
    expect(mainContent).toContain(`import 'bootstrap/dist/css/bootstrap.min.css';`);

    const appContent = tree.readContent('/src/App.tsx');
    expect(appContent).toMatch(/import.*Alert.*from 'reactstrap'/);
    expect(appContent).toMatch(/<Alert color="success">reactstrap installed successfully!\r?\n\s+<span role="img" aria-label="hooray">\?<\/span>\r?\n\s+<\/Alert>/m);

    const json = JSON.parse(tree.readContent('/package.json'));
    const dependencies = json.dependencies;
    expect(dependencies['bootstrap']).toBeDefined();
    expect(dependencies['reactstrap']).toBeDefined();
    expect(dependencies['@types/reactstrap']).toBeDefined();

    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  });
});
