module.exports = {
  description: 'Feature generator',
  prompts: [
    {
      type: 'input',
      name: 'name',
      message: 'feature name',
    },
  ],
  actions: [
    {
      type: 'add',
      path: 'src/features/{{kebabCase name}}/api/.gitkeep',
      template: '',
    },
    {
      type: 'add',
      path: 'src/features/{{kebabCase name}}/components/.gitkeep',
      template: '',
    },
  ],
};
