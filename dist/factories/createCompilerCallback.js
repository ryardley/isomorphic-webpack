'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _findInstance = require('../utilities/findInstance');

var _findInstance2 = _interopRequireDefault(_findInstance);

var _getBundleName = require('../utilities/getBundleName');

var _getBundleName2 = _interopRequireDefault(_getBundleName);

var _createResourceMap = require('./createResourceMap');

var _createResourceMap2 = _interopRequireDefault(_createResourceMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @flow

var debug = (0, _debug2.default)('isomorphic-webpack');

exports.default = function (compiler /*: Compiler*/, callback /*: Function*/) /*: Function*/ {
  var dllPlugin = (0, _findInstance2.default)(compiler.options.plugins, _webpack.DllPlugin);
  var manifestPath = dllPlugin.options.path;

  debug('manifestPath', manifestPath);

  var outputFileSystem = compiler.outputFileSystem;

  return function (error /*: Object*/, stats /*: Object*/) {
    if (error) {
      debug('compiler error:', error);

      return;
    }

    if (stats.compilation.errors.length) {
      debug('compilation error', stats.compilation.errors);

      return;
    }

    if (stats.compilation.missingDependencies.length) {
      debug('aborting compilation; missing dependencies', stats.compilation.missingDependencies);

      return;
    }

    if (!outputFileSystem.existsSync(manifestPath)) {
      throw new Error('Manifest file does not exist.');
    }

    var manifest = JSON.parse(outputFileSystem.readFileSync(manifestPath));

    debug('manifest', manifest);

    var requestMap = (0, _createResourceMap2.default)(manifest.content);

    debug('requestMap', requestMap);

    var bundleName = (0, _getBundleName2.default)(compiler.options.entry);

    debug('bundleName', bundleName);

    var absoluteEntryBundleName = _path2.default.resolve(compiler.options.output.path, bundleName + '.js');

    if (!outputFileSystem.existsSync(absoluteEntryBundleName)) {
      throw new Error('Bundle file does not exist.');
    }

    if (!outputFileSystem.existsSync(absoluteEntryBundleName + '.map')) {
      throw new Error('Bundle map file does not exist.');
    }

    var bundleCode = outputFileSystem.readFileSync(absoluteEntryBundleName, 'utf-8');

    var bundleSourceMap = JSON.parse(outputFileSystem.readFileSync(absoluteEntryBundleName + '.map', 'utf-8'));

    callback({
      bundleCode,
      bundleSourceMap,
      requestMap
    });
  };
};

module.exports = exports['default'];