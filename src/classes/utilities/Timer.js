/**
     __   _  __ ____
    / /  | |/ // __ \
   / /   |   // / / /
  / /___/   |/ /_/ /
 /_____/_/|_/_____/

 @author Alan Doherty (BattleCrate Ltd.)
 @license MIT
 **/

var utils = require("../../utils");

// timer
var Timer = utils.class_("Timer", {
    /**
     * @private
     */
    _interval: -1,

    /**
     * @private
     */
    _enabled: false,

    /**
     * @private
     */
    _tick: null,

    /**
     * The internal tick function.
     * @private
     */
    _innerTick: function() {
        // check if disabled
        if (this._enabled == false)
            return;

        // tick
        this._tick();

        // set next tick
        var timer = this;

        setTimeout(function() { timer._innerTick(); }, this._interval);
    },

    /**
     * Enables the timer.
     */
    enable: function() {
        if (this._enabled == false) {
            this._enabled = true;
            var timer = this;
            setTimeout(function() { timer._innerTick(); }, this._interval);
        }
    },

    /**
     * Disables the timer.
     */
    disable: function() {
        if (this._enabled == true) {
            this._enabled = false;
        }
    },

    /**
     * Gets or sets the interval (ms).
     * @param {number?} interval
     * @returns {number|undefined}
     */
    interval: function(interval) {
        if (interval === undefined) {
            this._interval = interval;
        } else {
            return this._interval;
        }
    },

    /**
     * Gets or sets the tick function.
     * @param {function?} tickFunc
     * @returns {function|undefined}
     */
    tick: function(tickFunc) {
        if (tickFunc === undefined) {
            this._tick = tickFunc;
        } else {
            return this._tick;
        }
    },

    /**
     * Creates a new timer.
     * @param {number?} interval
     * @param {function?} tickFunc
     */
    constructor: function(interval, tickFunc) {
        this._interval = interval === undefined ? 1000 : interval;
        this._enabled = false;
        this._tick = tickFunc === undefined ? function() {} : tickFunc;
    }
});

// export
module.exports = Timer;