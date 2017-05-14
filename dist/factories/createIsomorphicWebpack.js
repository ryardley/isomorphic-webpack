'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _sourceMap = require('source-map');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _evalCodeInBrowser = require('../utilities/evalCodeInBrowser');

var _evalCodeInBrowser2 = _interopRequireDefault(_evalCodeInBrowser);

var _getEntryScriptPath = require('../utilities/getEntryScriptPath');

var _getEntryScriptPath2 = _interopRequireDefault(_getEntryScriptPath);

var _createCompiler = require('./createCompiler');

var _createCompiler2 = _interopRequireDefault(_createCompiler);

var _createCompilerCallback = require('./createCompilerCallback');

var _createCompilerCallback2 = _interopRequireDefault(_createCompilerCallback);

var _createCompilerConfiguration = require('./createCompilerConfiguration');

var _createCompilerConfiguration2 = _interopRequireDefault(_createCompilerConfiguration);

var _createIsomorphicWebpackConfiguration = require('./createIsomorphicWebpackConfiguration');

var _createIsomorphicWebpackConfiguration2 = _interopRequireDefault(_createIsomorphicWebpackConfiguration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @flow

/*:: import type {
  UserIsomorphicWebpackConfigurationType
} from '../types';*/


var debug = (0, _debug2.default)('isomorphic-webpack');

/*:: type IsomorphicWebpackType = {|

  /**
   * @see https://webpack.github.io/docs/node.js-api.html#compiler
   *-/
  compiler: Compiler,
  createCompilationPromise: Function,
  evalBundleCode: Function,
  formatErrorStack: Function
|};*/
/*:: type ErrorPositionType = {|
  +column: number,
  +line: number,
  +source: string
|};*/

exports.default = function (webpackConfiguration /*: Object*/, userIsomorphicWebpackConfiguration /*:: ?: UserIsomorphicWebpackConfigurationType*/) /*: IsomorphicWebpackType*/ {
  var isomorphicWebpackConfiguration = (0, _createIsomorphicWebpackConfiguration2.default)(userIsomorphicWebpackConfiguration);
  var compilerConfiguration = (0, _createCompilerConfiguration2.default)(webpackConfiguration, isomorphicWebpackConfiguration.nodeExternalsWhitelist);
  var compiler = (0, _createCompiler2.default)(compilerConfiguration);

  var createCompilationPromise = void 0;

  /**
   * @see https://github.com/gajus/isomorphic-webpack#isomorphic-webpack-faq-how-to-delay-request-handling-while-compilation-is-in-progress
   */
  if (isomorphicWebpackConfiguration.useCompilationPromise) {
    var compilationPromise = void 0;
    var compilationPromiseResolve = void 0;
    var compilationPromiseIsResolved = true;

    createCompilationPromise = function createCompilationPromise() {
      return compilationPromise;
    };

    compiler.plugin('compile', function () {
      debug('compiler event: compile (compilationPromiseIsResolved: %s)', compilationPromiseIsResolved);

      if (!compilationPromiseIsResolved) {
        return;
      }

      compilationPromiseIsResolved = false;

      compilationPromise = new Promise(function (resolve) {
        compilationPromiseResolve = resolve;
      });
    });

    compiler.plugin('done', function () {
      debug('compiler event: done');

      compilationPromiseIsResolved = true;

      compilationPromiseResolve();
    });
  } else {
    createCompilationPromise = function createCompilationPromise() {
      throw new Error('"createCompilationPromise" feature has not been enabled.');
    };
  }

  var bundleSourceMapConsumer = void 0;

  var currentBundleCode = void 0;
  var currentRequestMap = void 0;

  var evalBundleCode = function evalBundleCode(windowUrl /*:: ?: string*/) {
    var requireModule = (0, _evalCodeInBrowser2.default)(currentBundleCode, {}, windowUrl);

    var entryScriptPath = (0, _getEntryScriptPath2.default)(compiler.options.entry);

    debug('entryScriptPath', entryScriptPath);

    // @todo Make it work in Windows.
    var relativeEntryScriptPath = './' + _path2.default.relative(webpackConfiguration.context, require.resolve(entryScriptPath));

    var moduleId = currentRequestMap[relativeEntryScriptPath];

    if (typeof moduleId !== 'number') {
      throw new Error('Cannot determine entry module ID.');
    }

    debug('evaluating module ID %i', moduleId);

    return requireModule(moduleId);
  };

  var compilerCallback = (0, _createCompilerCallback2.default)(compiler, function (_ref) {
    var bundleCode = _ref.bundleCode,
        bundleSourceMap = _ref.bundleSourceMap,
        requestMap = _ref.requestMap;

    bundleSourceMapConsumer = new _sourceMap.SourceMapConsumer(bundleSourceMap);
    currentBundleCode = bundleCode;
    currentRequestMap = requestMap;
  });

  compiler.watch({}, compilerCallback);

  var isOriginalPositionDiscoverable = function isOriginalPositionDiscoverable(lineNumber /*: number*/, columnNumber /*: number*/) /*: boolean*/ {
    var originalPosition = bundleSourceMapConsumer.originalPositionFor({
      column: columnNumber,
      line: lineNumber
    });

    return originalPosition.source !== null && originalPosition.line !== null && originalPosition.column !== null;
  };

  var getOriginalPosition = function getOriginalPosition(lineNumber /*: number*/, columnNumber /*: number*/) /*: ErrorPositionType*/ {
    var originalPosition = bundleSourceMapConsumer.originalPositionFor({
      column: columnNumber,
      line: lineNumber
    });

    return {
      column: originalPosition.column,
      line: originalPosition.line,
      source: originalPosition.source.replace('webpack://', webpackConfiguration.context)
    };
  };

  var formatErrorStack = function formatErrorStack(errorStack /*: string*/) /*: string*/ {
    return errorStack.replace(/isomorphic-webpack:(\d+):(\d+)/g, function (match, lineNumber, columnNumber) {
      var targetLineNumber = Number(lineNumber);
      var targetColumnNumber = Number(columnNumber);

      if (!isOriginalPositionDiscoverable(targetLineNumber, targetColumnNumber)) {
        return match;
      }

      var originalPosition = getOriginalPosition(targetLineNumber, targetColumnNumber);

      return originalPosition.source + ':' + originalPosition.line + ':' + originalPosition.column;
    });
  };

  return {
    compiler,
    createCompilationPromise,
    evalBundleCode,
    formatErrorStack
  };
};

module.exports = exports['default'];