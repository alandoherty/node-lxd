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
 * @param {object?} authentication
 * @param {string?} authentication.cert
 * @param {string?} authentication.key
 * @param {string?} authentication.password
 * @returns Client
 */
function lxd(host, authentication) {
  return new Client(host, authentication);
}

// exports
module.exports = lxd;
