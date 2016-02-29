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
    EventEmitter = require("events").EventEmitter,
    Timer = require("./utilities/Timer");

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
     * @private
     */
    _control: null,

    /**
     * @private
     */
    _pingTimer: null,

    /**
     * Closes the process.
     */
    close: function() {
        this._stdIn.close();
        this._stdOut.close();
        this._stdErr.close();
        this.emit("close");
    },

    /**
     * Write some data to the process's standard input.
     * @param {string|Buffer} data
     */
    write: function(data) {
        this._stdIn.send(data, {binary: true});
    },

    /**
     * Resize's the output window.
     * @param {number} width
     * @param {number} height
     */
    resize: function(width, height) {
        this._control.send(JSON.stringify({
            command: "window-resize",
            width: width,
            height: height
        }));
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
        this._control = webSockets[3];

        // setup events
        var process = this;

        // close
        this._control.on("close", function() {
            process.close();
        });

        // messages
        this._stdOut.on("message", function(a, b, c) {
            process.emit("data", false, a.toString("utf8").trim());
        });

        this._stdErr.on("message", function(a, b, c) {
            process.emit("data", true, a.toString("utf8").trim());
        });
    }
});

// export
module.exports = Process;