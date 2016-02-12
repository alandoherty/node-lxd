/**
     __   _  __ ____
    / /  | |/ // __ \
   / /   |   // / / /
  / /___/   |/ /_/ /
 /_____/_/|_/_____/

 @author Alan Doherty (BattleCrate Ltd.)
 @license MIT
 **/

// requires
var utils = require("../utils");

// operation error
var Profile = utils.class_("Profile", {
    /**
     * @private
     */
    _metadata: {},

    /**
     * @private
     */
    _client: null,

    /**
     * Gets the client this profile is on.
     * @returns {Client}
     */
    client: function() {
        return this._client;
    },

    /**
     * Gets the metadata for this profile.
     * @returns {object}
     */
    metadata: function() {
        return this._metadata;
    },

    /**
     * Gets the profile name or sets the profile name.
     * @param {string?} name
     * @param {function?} callback
     * @returns {string|undefined}
     */
    name: function(name, callback) {
        if (name === undefined) {
            return this._metadata.name;
        } else {
            // callback
            if (callback === undefined)
                callback = function(){};

            // request
            var profile = this;

            this._client._request("POST /profiles/" + name, {name: name}, function(err, metadata) {
                if (err) {
                    callback(err);
                } else {
                    profile._metadata.name = name;
                    callback(null, name);
                }
            });
        }
    },

    /**
     * Delete the profile.
     * @param {function} callback
     */
    delete: function(callback) {
        this._client._request("DELETE /profiles/" + this.name(), {}, function(err, metadata) {
            callback(err);
        });
    },

    /**
     * Refreshes the profile information.
     * @param {function} callback
     */
    refresh: function(callback) {
        var profile = this;

        this._client._request("GET /profiles/" + this._metadata.name, {}, function(err, metadata) {
            if (err) {
                callback(err);
            } else {
                profile._metadata = metadata;
                callback(err, profile);
            }
        });
    },

    /**
     * Creates a profile.
     * @param {Client} client
     * @param {object} metadata
     */
    constructor: function(client, metadata) {
        this._client = client;
        this._metadata = metadata;
        console.log(metadata);
    }
});

// export
module.exports = Profile;