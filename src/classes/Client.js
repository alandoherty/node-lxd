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
    request = require("request"),
    Operation = require("./Operation"),
    OperationError = require("./OperationError"),
    Container = require("./Container"),
    TaskQueue = require("./TaskQueue");

// client
var Client = utils.class_("Client", {
    /**
     * The request.js path for the API.
     */
    _path: "",

    /**
     * Gets all containers.
     * @param {boolean?} lazy
     * @param {function} callback
     * @returns {Container[]}
     */
    list: function(lazy, callback) {
        // arguments
        if (arguments.length == 1) {
            callback = arguments[0];
            lazy = false;
        }

        // request
        var client = this;

        this._request("GET /containers", {}, function(err, body) {
            if (err) {
                callback(err);
            } else {
                // get queue
                var getQueue = new TaskQueue();
                var containers = [];

                for (var i = 0; i < body.length; i++) {
                    // get container name
                    var name = body[i].split("/");
                    name = name[name.length - 1];

                    // queue get operation or push name if lazy
                    if (lazy === true) {
                        containers.push(name);
                    } else {
                        (function (name) {
                            getQueue.queue(function (done) {
                                client.get(name, function (err, container) {
                                    // push container, if we error we (assume) that the container
                                    // was deleted while downloading, so we don't break everything
                                    // by returning an error.
                                    if (!err)
                                        containers.push(container);

                                    // done
                                    done();
                                });
                            });
                        })(name);
                    }
                }

                // execute queue
                getQueue.executeAll(function() {
                   callback(null, containers);
                });
            }
        });
    },

    /**
     * Gets a container with the specified name.
     * @param {string} name
     * @param {function} callback
     */
    get: function(name, callback) {
        var client = this;

        client._request("GET /containers/" + name, {}, function(err, body) {
            if (err) {
                callback(err);
            } else {
                callback(null, new Container(client, body));
            }
        });
    },

    /**
     * Creates a new container.
     * @param {string} name
     * @param {string} image
     * @param {object?} config
     * @param {string?} profile
     * @param {function?} callback
     * @returns {Operation}
     */
    create: function(name, image, config, profile, callback) {
        // config
        if (config === undefined)
            config = {};
        if (profile === undefined)
            profile = "default";

        // callback
        callback = arguments[arguments.length - 1];

        if (typeof(callback) !== "function")
            callback = function() { };

        // request
        var client = this;

        return this._request("POST /containers", {
            "name": name,
            "architecture": 2,
            "profiles": [profile],
            "ephemeral": false,
            "config": config,
            "source": {"type": "image", "alias": image}
        }, function(err, operation) {
            if (err) {
                callback(err);
            } else {
                client.get(name, function(err, container) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, container);
                    }
                })
            }
        });
    },

    /**
     * Gets information about the server.
     * callback(err, info)
     * @param {function} callback
     */
    info: function(callback) {
        this._request("GET /", {}, function(err, body, res) {
            callback(err == null, body.metadata);
        });
    },

    /**
     * Performs a REST request on this client.
     * @param {string} path
     * @param {object} params
     * @param {function} callback
     * @returns {Operation}
     * @private
     */
    _request: function(path, params, callback) {
        // callback
        if (callback === undefined)
            callback = function() {};

        // parse path
        var route = path.substring(path.indexOf(" ") + 1).trim();
        var method = path.substring(0, path.indexOf(" ")).trim();

        if (route[0] == "/")
            route = route.substring(1);

        if (process.env.LXDN_DEV == "true")
            console.log(method + " -> " + this._path + "1.0" + (route.length == 0 ? "" : "/") + route);

        // request options
        var options = {
            url: this._path + "1.0" + (route.length == 0 ? "" : "/") + route,
            headers: { "Host" : "" }, // request normally sends weird lxc breaking host header, :?
            method: method,
            json: true,
            body: params
        };

        // make request
        var client = this;
        var operation = new Operation();

        request(options, function (error, response, body) {
            // log finished request
            if (process.env.LXDN_DEV == "true")
                (error == null ? console.log : console.error)
                    ((response == undefined ? "ERR" : response.statusCode) + " <- " + client._path + "1.0/" + route);

            // callback
            if (error !== null) {
                callback(new OperationError("HTTP Error", 400, error));
            } else {
                switch (body.type) {
                    case "async":
                        if (body.status_code == 100) {
                            // process operation
                            operation._process(body);

                            // wait for operation
                            client._request("GET /operations/" + body.metadata.id + "/wait", {}, function(err, body) {
                                if (err !== null) {
                                    callback(new OperationError("HTTP Error", "Failed", 400, error));
                                } else if (body.status_code >= 400 && body.status_code <= 599) {
                                    callback(new OperationError(body.err, body.status, body.status_code));
                                } else {
                                    callback(null, body);
                                }
                            });
                        } else {
                            throw "async returned non-created status code";
                        }

                        break;
                    case "sync":
                        callback(null, body.metadata);
                        break;
                    case "error":
                        callback(new OperationError(body.error, body.error, body.error_code));
                        break;
                    default:
                        throw "unknown operation type: " + body.type;
                }
            }
        });

        return operation;
    },

    /**
     * Creates a new LXD client.
     * @param {string} host
     */
    constructor: function(host) {
        // path
        this._path = host === undefined ? "http://unix:/var/lib/lxd/unix.socket:/" : "http://" + host + "/";

        // variables
    }
});

// export
module.exports = Client;