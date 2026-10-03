const fs = require('node:fs');

const componentGenerator = require('../component/index.cjs');
const featureGenerator = require('../feature/index.cjs');

const actionsFor = (generator, answers) =>
  typeof generator.actions === 'function'
    ? generator.actions(answers)
    : generator.actions;

const registerGenerators = () => {
  const registered = {};
  const plop = {
    setGenerator: (name, config) => {
      registered[name] = config;
    },
  };
  require('../../plopfile.cjs')(plop);
  return registered;
};

describe('component generator', () => {
  test('emits index, component, story, and test files into shared components', () => {
    const actions = actionsFor(componentGenerator, {
      feature: 'components',
      folder: 'widgets',
    });

    expect(actions.map((action) => action.path)).toEqual([
      'src/components/{{folder}}/{{kebabCase name}}/index.ts',
      'src/components/{{folder}}/{{kebabCase name}}/{{kebabCase name}}.tsx',
      'src/components/{{folder}}/{{kebabCase name}}/{{kebabCase name}}.stories.tsx',
      'src/components/{{folder}}/{{kebabCase name}}/__tests__/{{kebabCase name}}.test.tsx',
    ]);
  });

  test('emits the same four files into a feature', () => {
    const actions = actionsFor(componentGenerator, { feature: 'plan' });

    expect(actions.map((action) => action.path)).toEqual([
      'src/features/{{feature}}/components/{{kebabCase name}}/index.ts',
      'src/features/{{feature}}/components/{{kebabCase name}}/{{kebabCase name}}.tsx',
      'src/features/{{feature}}/components/{{kebabCase name}}/{{kebabCase name}}.stories.tsx',
      'src/features/{{feature}}/components/{{kebabCase name}}/__tests__/{{kebabCase name}}.test.tsx',
    ]);
  });

  test('ships a template file for every emitted file', () => {
    const actions = actionsFor(componentGenerator, { feature: 'plan' });

    for (const action of actions) {
      expect(fs.existsSync(action.templateFile)).toBe(true);
    }
  });
});

describe('feature generator', () => {
  test('scaffolds the uniform api and components folders', () => {
    const actions = actionsFor(featureGenerator, { name: 'scholarships' });

    expect(actions.map((action) => action.path)).toEqual([
      'src/features/{{kebabCase name}}/api/.gitkeep',
      'src/features/{{kebabCase name}}/components/.gitkeep',
    ]);
  });
});

describe('plopfile', () => {
  test('registers the component and feature generators', () => {
    const registered = registerGenerators();

    expect(Object.keys(registered).sort()).toEqual(['component', 'feature']);
  });
});
