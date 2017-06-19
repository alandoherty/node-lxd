/**
 *     __   _  __ ____
 *    / /  | |/ // __ \
 *   / /   |   // / / /
 *  / /___/   |/ /_/ /
 * /_____/_/|_/_____/
 *
 * @author Alan Doherty (BattleCrate Ltd.)
 * @license MIT
 */

// requires
var utils = require('../utils');

// operation error
var OperationError = utils.class_('OperationError', {
  /**
   * @private
   */
  _message: '',

  /**
   * @private
   */
  _statusCode: -1,

  /**
   * @private
   */
  _status: '',

  /**
   * @private
   */
  _innerError: null,

  /**
   * Gets the error message.
   * @returns {string}
   */
  getMessage: function() {
    return this._message;
  },

  /**
   * Gets the status code.
   * @returns {number}
   */
  getStatusCode: function() {
    return this._statusCode;
  },

  /**
   * Gets the status.
   * @returns {string}
   */
  getStatus: function() {
    return this._status;
  },

  /**
   * Gets the inner error.
   */
  getInnerError: function() {
    return this._innerError;
  },

  /**
   * Creates a new operation error.
   * @param {string} message
   * @param {string} status
   * @param {number} statusCode
   * @param {object?} innerError
   */
  constructor: function(message, status, statusCode, innerError) {
    this._message = message;
    this._status = status;
    this._statusCode = statusCode;
    this._innerError = (innerError === undefined) ? null : innerError;
  },
});

// export
module.exports = OperationError;
