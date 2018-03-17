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
   * Gets the auto_update flag
   * @returns {boolean}
   */
  auto_update: function () {
    return this._metadata.auto_update;
  },

  /**
   * Gets the public flag
   */
  public: function () {
    return this._metadata.public;
  },

  /**
   * Gets the image filename
   */
  filename: function() {
    return this._metadata.filename;
  },

  /**
   * Gets the source of the update
   */
  update_source: function() {
    return this._metadata.update_source;
  },

  /**
   * Gets the cached flag
   */
  cache: function() {
    return this._metadata.cached;
  },

  /**
   * Gets the image fingerprint
   * @returns {string}
   */
  fingerprint: function () {
    return this._metadata.fingerprint;
  },

  /**
   * Refresh an image from its origin
   */
  refresh: function (callback) {
    var image = this;
    this._client._request('POST /images/' + this._metadata.fingerprint + '/refresh', {},
      function (err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, data)
        }
      });
  },


  /**
   * Delete the image.
   * @param {function} callback
   */
  delete: function(callback) {
    var deleteQueue = new TaskQueue();

    var error = null;
    var image = this;

    // delete the image
    deleteQueue.queue(function(done) {
      image._client._request('DELETE /images/' + image.fingerprint(), {},
        function(err, metadata) {
          if (err !== null) error = err;
          done();
        });
    });

    // execute
    deleteQueue.executeAll(function() {
      callback(error);
    });
  },

  /**
   * Creates a new image.
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
