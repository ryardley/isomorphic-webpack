'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // @flow

var _vm = require('vm');

var _vm2 = _interopRequireDefault(_vm);

var _jsdom = require('jsdom');

var _jsdom2 = _interopRequireDefault(_jsdom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Runs code and returns the value of the last expression evaluated.
 */
/*:: type RunInNewContextType = {
  columnOffset?: number,
  displayErrors?: boolean,
  lename?: string,
  lineOffset?: number,
  timeout?: number
};*/

exports.default = function (code /*: string*/) /*: any*/ {
  var userOptions /*: RunInNewContextType*/ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var windowUrl /*:: ?: string*/ = arguments[2];

  var window = _jsdom2.default.jsdom('<html><body></body></html>').defaultView;

  if (windowUrl) {
    _jsdom2.default.changeURL(window, windowUrl);
  }

  var sandbox = {
    console,
    document: window.document,
    ISOMORPHIC_WEBPACK: true,
    process: {
      env: {
        // eslint-disable-next-line no-process-env
        NODE_ENV: process.env.NODE_ENV
      }
    },
    require,
    Buffer,
    clearImmediate,
    clearInterval,
    clearTimeout,
    setImmediate,
    setInterval,
    setTimeout,
    window
  };

  var options = _extends({
    displayErrors: true,
    filename: 'isomorphic-webpack',
    timeout: 5000
  }, userOptions);

  return _vm2.default.runInNewContext(code, sandbox, options);
};

module.exports = exports['default'];