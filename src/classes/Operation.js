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

// client
var Operation = utils.class_("Operation", {
    /**
     * @private
     */
    _type: "",

    /**
     * @private
     */
    _status: "",

    /**
     * @private
     */
    _statusCode: -1,

    /**
     * @private
     */
    _started: false,

    /**
     * @private
     */
    _id: "",

    /**
     * @private
     */
    _metadata: {},

    /**
     * Gets the type.
     * @returns {string}
     */
    getType: function() {
        return this._type;
    },

    /**
     * Gets the status or error.
     * @returns {string}
     */
    getStatus: function() {
        return this._status;
    },

    /**
     * Gets the status code.
     * @returns {number}
     */
    getStatusCode: function() {
        return this._statusCode;
    },

    /**
     * Gets if the operation has started.
     * @returns {boolean}
     */
    hasStarted: function() {
        return this._started;
    },

    /**
     * Processes the JSON data into the operation.
     * @param {object} data
     * @internal
     */
    _process: function(data) {
        // type
        this._started = true;
        this._type = data.type;

        // get status info
        this._status = data.status;
        this._statusCode = data.status_code;

        // id & metadata
        this._id = data.metadata.id;
        this._metadata = data.metadata;
    },

    /**
     * Creates an operation.
     */
    constructor: function() {
        this._started = false;
        this._type = "";
        this._status = "";
        this._statusCode = 100;
        this._metadata = {};
        this._id = "";
    }
});

// export
module.exports = Operation;