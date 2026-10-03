const componentGenerator = require('./generators/component/index.cjs');
const featureGenerator = require('./generators/feature/index.cjs');

/**
 *
 * @param {import('plop').NodePlopAPI} plop
 */
module.exports = function (plop) {
  plop.setGenerator('component', componentGenerator);
  plop.setGenerator('feature', featureGenerator);
};
