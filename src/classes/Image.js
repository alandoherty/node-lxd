/**
 *     __   _  __ ____
 *    / /  | |/ // __ \
 *   / /   |   // / / /
 *  / /___/   |/ /_/ /
 * /_____/_/|_/_____/
 *
 * @author Livio Brunner
 * @license MIT
 */

// requires
var utils = require('../utils');
var TaskQueue = require('./utilities/TaskQueue');

// image
var Image = utils.class_('Image', {
  /**
   * Gets the client this image is on.
   * @returns {Client}
   */
  client: function () {
    return this._client;
  },

  /**
   * Gets the metadata for this image.
   * @returns {object}
   */
  metadata: function () {
    return this._metadata;
  },

  /**
   * Gets the aliases
   * @returns {{name: string, description: string}}
   */
  aliases: function () {
    return this._metadata.aliases;
  },

  /**
   * Gets the properties
   * @returns {string}
   */
  properties: function () {
    return this._metadata.properties;
  },

  /**
   * Gets the architecture
   * @returns {string}
   */
  architecture: function () {
    return this._metadata.architecture;
  },

  /**
   * Gets the size of the image
   * @returns {number}
   */
  size: function () {
    return this._metadata.size;
  },

  /**
   * Gets the image fingerprint
   * @returns {string}
   */
  fingerprint: function () {
    return this._metadata.fingerprint;
  },

  /**
   * Creates a new container.
   * @param {Client} client
   * @param {object} metadata
   */
  constructor: function (client, metadata) {
    this._client = client;
    this._metadata = metadata;
  },
});

// export
module.exports = Image;
