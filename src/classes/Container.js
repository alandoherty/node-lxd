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
    fs = require("fs"),
    Process = require("./Process"),
    TaskQueue = require("./utilities/TaskQueue"),
    OperationError = require("./OperationError");

// container
var Container = utils.class_("Container", {
    /**
     * @private
     */
    _metadata: {},

    /**
     * @private
     */
    _client: null,

    /**
     * Gets the client this container is on.
     * @returns {Client}
     */
    client: function() {
        return this._client;
    },

    /**
     * Gets the metadata for this container.
     * @returns {object}
     */
    metadata: function() {
        return this._metadata;
    },

    /**
     * Gets the architecture.
     * @returns {number}
     */
    architecture: function() {
        return this._metadata.architecture;
    },

    /**
     * Gets the container name or sets the container name.
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
            var container = this;

            this._client._request("POST /containers/" + name, {name: name}, function(err, metadata) {
                if (err) {
                    callback(err);
                } else {
                    container._metadata.name = name;
                    callback(null, name);
                }
            });
        }
    },

    /**
     * Gets the interface on this container with the specified name and optional protocol.
     * @param {string} interface_
     * @param {string?} protocol
     * @returns {object|null}
     */
    ip: function(interface_, protocol) {
        // check if ip's unavailable
        if (this._metadata.status.ips === null)
            return null;

        // get ips
        var ips =  this._metadata.status.ips;

        for (var i = 0; i < ips.length; i++) {
            if (ips[i].interface == interface_ && (protocol === undefined || ips[i].protocol == protocol)) {
                return ips[i];
            }
        }

        return null;
    },

    /**
     * Gets the IPv4 address of this container.
     * @param {function?} callback The callback if waiting for ipv4.
     * @returns {string|undefined}
     */
    ipv4: function(callback) {
        if (callback === undefined) {
            // check if ips available yet
            if (this._metadata.status.ips === null)
                return "";

            var ipv4 = this.ip("eth0", "IPV4");
            return ipv4 == null ? "" : ipv4.address;
        } else {
            // check if we have it already
            if (this.ipv4() != "") {
                callback(null, this.ipv4());
                return;
            }

            // refresh until IPv4 obtained
            var container = this;
            var tries = 0;

            var retryIPv4 = function() {
                container.refresh(function(err) {
                    var ipv4 = container.ipv4();

                    if (ipv4 == "") {
                        // maximum tries (10s)
                        if (tries == 15) {
                            callback(new Error("Exceeded retries"));
                            return;
                        }

                        // retry
                        setTimeout(retryIPv4, 1000);
                        tries++;
                    } else {
                        callback(null, container.ipv4());
                    }
                });
            };

            // start trying to obtain ipv4
            retryIPv4();
        }
    },

    /**
     * Gets the IPv6 address of this container.
     * @param {function?} callback
     * @returns {string|undefined}
     */
    ipv6: function(callback) {
        if (callback === undefined) {
            // check if ips available yet
            if (this._metadata.status.ips === null)
                return "";

            var ipv6 = this.ip("eth0", "IPV6");
            return ipv6 == null ? "" : ipv6.address;
        } else {
            // check if we have it already
            if (this.ipv6() != "") {
                callback(null, this.ipv6());
                return;
            }

            // refresh until IPv6 obtained
            var container = this;
            var tries = 0;

            var retryIPv6 = function() {
                container.refresh(function(err) {
                    var ipv6 = container.ipv6();

                    if (ipv6 == "") {
                        // maximum tries (10s)
                        if (tries == 10) {
                            callback(new Error("Exceeded retries"));
                            return;
                        }

                        // retry
                        setTimeout(retryIPv6, 1000);
                        tries++;
                    } else {
                        callback(null, container.ipv6());
                    }
                });
            };

            // start trying to obtain IPv6
            retryIPv6();
        }
    },

    /**
     * Gets the number of running processes in this container.
     * @returns {number}
     */
    processCount: function() {
        return this._metadata.status.processcount;
    },

    /**
     * Refreshes the container information.
     * @param {function} callback
     */
    refresh: function(callback) {
        var container = this;

        this._client._request("GET /containers/" + this._metadata.name, {}, function(err, metadata) {
            if (err) {
                callback(err);
            } else {
                container._metadata = metadata;
                callback(err, container);
            }
        });
    },

    /**
     * Executes a terminal command on the container
     * @param {string[]} command The command with arguments.
     * @param {object?} env The environment data, optional.
     * @param {function} callback The callback.
     */
    run: function(command, env, callback) {
        // get closure arguments
        var _arguments = arguments;
        var _callback = _arguments[_arguments.length - 1];

        // our callback function
        function __callback(err, process) {
            // check for errors
            if (err) {
                _callback(err);
                return;
            }

            // handle stdout/stderr
            var stdOut = "";
            var stdErr = "";

            process.on("data", function(isErr, msg) {
                if (isErr) stdErr += msg; else stdOut += msg;
            });

            // handle close
            process.on("close", function() {
               _callback(null, stdOut, stdErr);
            });
        }

        // pass to exec function, but replace callback
        _arguments[_arguments.length - 1] = __callback;
        this.exec.apply(this, arguments);
    },

    /**
     * Executes a terminal command on the container.
     * @param {string[]} command The command with arguments.
     * @param {object?} env The environment data, optional.
     * @param {function} callback The callback.
     */
    exec: function(command, env, callback) {
        // callback
        callback = arguments[arguments.length - 1];

        // environment
        if (arguments.length == 2)
            env = {};

        // request
        var container = this;

        this._client._request("POST /containers/" + this.name() + "/exec", {
            "command": command,
            "environment": env,
            "wait-for-websocket" : true,
            "interactive" : false
        }, false, function(err, operation) {
            // get metadata
            var md = operation.metadata();

            // socket connect queue
            var wsQueue = new TaskQueue();
            var ws = [];

            for (var i = 0; i < 4; i++) {
                (function(i) {
                    wsQueue.queue(function(done) {
                        operation.webSocket(md.metadata.fds[(i == 3) ? "control" : i.toString()], function (err, websocket) {
                            if (err) {
                                for (var j = 0; j < i; j++)
                                    ws[j].close();

                                callback(err);
                            } else {
                                ws[i] = websocket;
                                done();
                            }
                        });
                    });
                })(i);
            }

            // execute
            wsQueue.executeAll(function() {
               callback(null, new Process(container, ws));
            });
        });
    },

    /**
     * Gets the status or sets the state.
     * @param {string?} state
     * @param {number?} timeout
     * @param {function?} callback
     * @returns {object|undefined}
     */
    state: function(state, timeout, callback) {
        if (state === undefined) {
            return this._metadata.status;
        } else {
            // callback
            if (callback === undefined)
                callback = function(){};

            // change state
            var container = this;

            this._client._request("PUT /containers/" + this._metadata.name + "/state", {
                "action": state,
                "timeout": timeout,
                "force": true
            }, function(err, body) {
                if (err) {
                    callback(err);
                } else {
                    container.refresh(function (err2) {
                        callback(err2);
                    });
                }
            });
        }
    },

    /**
     * Starts the container.
     * @param {function} callback
     */
    start: function(callback) {
        this.state("start", 30, callback);
    },

    /**
     * Stops the container.
     * @param {function} callback
     */
    stop: function(callback) {
        this.state("stop", 30, callback);
    },

    /**
     * Restarts the container.
     * @param {function} callback
     */
    restart: function(callback) {
        this.state("restart", 30, callback);
    },

    /**
     * Freezes the container.
     * @param {function} callback
     */
    freeze: function(callback) {
        this.state("freeze", 30, callback);
    },

    /**
     * Freezes the container.
     * @param {function} callback
     */
    unfreeze: function(callback) {
        this.state("unfreeze", 30, callback);
    },

    /**
     * Delete the container.
     * @param {function} callback
     */
    delete: function(callback) {
        this._client._request("DELETE /containers/" + this.name(), {}, function(err, metadata) {
            callback(err);
        });
    },

    /**
     * Uploads data to a remote path on the container.
     * Container must be running.
     * @param {string} remotePath
     * @param {string|Buffer} data
     * @param {function} callback
     */
    upload: function(remotePath, data, callback) {
        // convert data
        if (Buffer.isBuffer(data))
            data = data.toString("ascii");

        // create operation
        var operation = this._client._request("POST /containers/" + this.name() + "/files?path=" + remotePath, data, function(err, metadata) {
            callback(err);
        });
    },

    /**
     * Downloads data from a remote path on the container.
     * Container must be running.
     * @param {string} remotePath
     * @param {function} callback
     */
    download: function(remotePath, callback) {
        // container
        var container = this;

        // read the file
        this._client._request("GET_RAW /containers/" + this.name() + "/files?path=" + remotePath, {}, function(err, metadata) {
            if (err)
                callback(err);
            else
                callback(null, metadata);
        });
    },

    /**
     * Uploads a file to a remote path on the container.
     * @param {string} localPath
     * @param {string} remotePath
     * @param {function} callback
     */
    uploadFile: function(localPath, remotePath, callback) {
        // container
        var container = this;

        // read the file
        fs.readFile(localPath, {}, function(err, buff) {
            // check for file error
            if (err) {
                callback(new OperationError("File Error", "Failed", 400, err));
                return;
            }

            // uploads the file
            container.upload(remotePath, buff, function(err) {
                callback(err);
            });
        });
    },

    /**
     * Downloads a file from the remote path on the container.
     * @param {string} remotePath
     * @param {string} localPath
     * @param {function} callback
     */
    downloadFile: function(remotePath, localPath, callback) {
        // container
        var container = this;

        // download
        this.download(remotePath, function(err, data) {
            // write to file
            fs.writeFile(localPath, data, {}, function(err) {
                if (err)
                    callback(err);
                else
                    callback(null);
            })
        });
    },

    /**
     * Creates a new container.
     * @param {Client} client
     * @param {object} metadata
     */
    constructor: function(client, metadata) {
        this._client = client;
        this._metadata = metadata;
    }
});

// export
module.exports = Container;