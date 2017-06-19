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
var Client = require('./classes/Client');

/**
 * Creates a new client at the specified host, if none
 * is provided the client will use the local domain socket.
 * @param {string?} host
 * @returns Client
 */
function lxd(host) {
  return new Client(host);
}

// exports
module.exports = lxd;
