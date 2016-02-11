/**
     __   _  __ ____
    / /  | |/ // __ \
   / /   |   // / / /
  / /___/   |/ /_/ /
 /_____/_/|_/_____/

 @author Alan Doherty (BattleCrate Ltd.)
 @license MIT
 **/

// utility functions
var utils = {
    /**
     * Creates a new class.
     * @param {string} name The name.
     * @param {object?} inherit The inherited type, optional.
     * @param {{}} tbl The reference table.
     * @retuens {object}
     */
    class_: function(name, inherit, tbl) {
        // process args
        var _tbl = arguments[arguments.length - 1];
        var _name = arguments[0];
        var _inherit = (arguments.length > 2) ? arguments[1] : null;

        // check arguments
        if (typeof(_name) !== "string") { throw "expected parameter `name` to be string"; }
        if (typeof(_inherit) !== "function" && _inherit !== null) { throw "expected parameter `function` to be object"; }
        if (typeof(_tbl) !== "object") { throw "expected parameter `tbl` to be object";}

        // create class
        var obj = _tbl.hasOwnProperty("constructor") ? _tbl.constructor : function() {};

        if (_inherit !== null)
            obj.prototype = Object.create(_inherit.prototype);

        // add methods
        for (var k in _tbl) {
            if (k !== "constructor" && _tbl.hasOwnProperty(k))
                obj.prototype[k] = _tbl[k];
        }

        // add get type method
        obj.prototype.getType = function() {
            return _name;
        };

        return obj;
    }
};

// export
module.exports = utils;