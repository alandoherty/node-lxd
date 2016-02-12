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
var utils = require("../utils"),
    EventEmitter = require("events").EventEmitter;

// process
var Process = utils.class_("Process", EventEmitter, {
    /**
     * @private
     */
    _container: null,

    /**
     * @private
     */
    _stdIn: null,

    /**
     * @private
     */
    _stdOut: null,

    /**
     * @private
     */
    _stdErr: null,

    /**
     * Closes the process.
     */
    close: function() {
        this._webSocket.close();
        this.emit("close");
    },

    /**
     * Creates a new operation error.
     * @param {Container} container
     * @param {function} webSockets
     */
    constructor: function(container, webSockets) {
        this._container = container;

        // web sockets
        this._stdIn = webSockets[0];
        this._stdOut = webSockets[1];
        this._stdErr = webSockets[2];

        // setup events
        var process = this;

        this._stdOut.on("message", function(a, b, c) {
            //process.emit("stdout", a.toString("utf8").trim());
            console.log("out: "+ a.toString("utf8").trim());
        });

        this._stdErr.on("message", function(a, b, c) {
            //process.emit("stdout", a.toString("utf8").trim());
            console.log("err:" + a.toString("utf8").trim().length);
        });
    }
});

// export
module.exports = Process;