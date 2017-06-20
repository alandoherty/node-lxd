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
var utils = require('../utils');
var fs = require('fs');
var Process = require('./Process');
var TaskQueue = require('./utilities/TaskQueue');
var OperationError = require('./OperationError');
var path_ = require('path');

// file system
var ContainerFS = utils.class_('ContainerFS', {
  /**
   * @private
   */
  _container: null,

  /**
   * @private
   */
  _base: '',

  /**
   * Gets or sets the base path.
   * @param {string} base
   */
  base: function(base) {
    if (this._base == undefined)
      return this._base;
    else
      this._base = base;
  },

  /**
   * Gets the parent container.
   * @returns {Container}
   */
  container: function() {
    return this._container;
  },

  chmod: function(path, mode, callback) {
    return fs.chmod(this.resolve(path), mode, callback);
  },

  chmodSync: function(path, mode) {
    return fs.chmodSync(this.resolve(path), mode, callback);
  },

  chown: function(path, uid, gid, callback) {
    return fs.chown(this.resolve(path), uid, gid, callback);
  },

  chownSync: function(path, uid, gid) {
    return fs.chownSync(this.resolve(path), uid, gid);
  },

  close: function(fd, callback) {
    return fs.close(fd, callback);
  },

  closeSync: function(fd) {
    return fs.closeSync(fd);
  },

  createReadStream: function(path, options) {
    return fs.createReadStream(this.resolve(path), options);
  },

  createWriteStream: function(path, options) {
    return fs.createWriteStream(this.resolve(path), options);
  },

  mkdir: function(path, mode, callback) {
    return fs.mkdir(this.resolve(path), mode, callback);
  },

  mkdirSync: function(path, mode) {
    return fs.mkdirSync(this.resolve(path), mode);
  },

  open: function(path, flags, mode, callback) {
    return fs.open(this.resolve(path), flags, mode, callback);
  },

  openSync: function(path, flags, mode) {
    return fs.openSync(this.resolve(path), flags, mode);
  },

  read: function(fd, buffer, offset, length, position, callback) {
    return fs.read(fd, buffer, offset, length, position, callback);
  },

  readdir: function(path, options, callback) {
    return fs.readdir(this.resolve(path), options, callback);
  },

  readdirSync: function(path, options) {
    return fs.readdirSync(this.resolve(path), options);
  },

  readFile: function(file, options, callback) {
    if (typeof file == 'string')
      return fs.readFile(this.resolve(file), options, callback);
    else
      return fs.readFile(file, options, callback);
  },

  readFileSync: function(file, options) {
    if (typeof file == 'string')
      return fs.readFileSync(this.resolve(file), options);
    else
      return fs.readFileSync(file, options);
  },

  readlink: function(path, options, callback) {
    return fs.readlink(this.resolve(path), options, callback);
  },

  readlinkSync: function(path, options) {
    return fs.readlinkSync(this.resolve(path), options);
  },

  readSync: function(fd, buffer, offset, length, position) {
    return fs.readSync(fd, buffer, offset, length, position);
  },

  realpath: function(path, options, callback) {
    return fs.realpath(this.resolve(path), options, callback);
  },

  realpathSync: function(path, options) {
    return fs.realpathSync(this.resolve(path), options);
  },

  rename: function(oldPath, newPath, callback) {
    return fs.rename(this.resolve(oldPath), this.resolve(newPath), callback);
  },

  renameSync: function(oldPath, newPath) {
    return fs.renameSync(this.resolve(oldPath), this.resolve(newPath));
  },

  rmdir: function(path, callback) {
    return fs.rmdir(this.resolve(path), callback);
  },

  rmdirSync: function(path) {
    return fs.rmdirSync(this.resolve(path));
  },

  stat: function(path, callback) {
    return fs.stat(this.resolve(path), callback);
  },

  statSync: function(path) {
    return fs.statSync(this.resolve(path), callback);
  },

  truncate: function(path, len, callback) {
    return fs.truncate(this.resolve(path), len, callback);
  },

  truncateSync: function(path, len) {
    return fs.truncateSync(this.resolve(path), len);
  },

  unlink: function(path, callback) {
    return fs.unlink(this.resolve(path), callback);
  },

  unlinkSync: function(path) {
    return fs.unlinkSync(this.resolve(path));
  },

  write: function(fd, buffer, offset, length, position, callback) {
    return fs.write(fd, buffer, offset, length, position, callback);
  },

  writeFile: function(file, data, options, callback) {
    if (typeof file == 'string')
      return fs.writeFile(this.resolve(file), data, options, callback);
    else
      return fs.writeFile(file, data, options, callback);
  },

  writeFileSync: function(file, data, options) {
    if (typeof file == 'string')
      return fs.writeFileSync(this.resolve(file), data, options);
    else
      return fs.writeFileSync(file, data, options);
  },

  writeSync: function(fd, buffer, offset, length, position) {
    return fs.writeSync(fd, buffer, offset, length, position);
  },

  /**
   * Resolves an absolute container-relative path into an absolute system path.
   * @param {string} path The path.
   * @returns {string}
   */
  resolve: function(path) {
    var root = '/var/lib/lxd/containers/' + this._container.name() + '/rootfs';

    // add extra base
    root = path_.join(root, this._base);

    // prevent sneaky attacks
    var joinedPath = path_.join(root, path);

    if (joinedPath.substr(0, root.length) != root)
      return root;

    return joinedPath;
  },

  /**
   * Creates a new file system wrapper for a container.
   * @param {Container} container
   */
  constructor: function(container) {
    this._container = container;
    this._base = '';
  },
});

// container
var Container = utils.class_('Container', {
  /**
   * @private
   */
  _metadata: {},

  /**
   * @private
   */
  _client: null,

  /**
   * The filesystem wrapper, local only.
   * @public
   */
  fs: null,

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
   * Gets the ephemeral flag
   * @returns {boolean}
   */
  ephemeral: function() {
    return this._metadata.ephemeral;
  },

  /**
   * Gets the stateful flag
   * @returns {boolean}
   */
  stateful: function() {
    return this._metadata.stateful;
  },

  /**
   * Gets the status (Running/Stopped)
   * @returns {string}
   */
  status: function() {
    return this._metadata.state.status;
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
        callback = function() {};

      // request
      var container = this;

      this._client._request('POST /containers/' + name, {name: name},
        function(err, metadata) {
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
    if (!this._metadata.state.network)
      return null;

    // check if interface unavailable
    if (!this._metadata.state.network[interface_])
      return null;

    // get ips
    var ips = this._metadata.state.network[interface_].addresses;

    for (var i = 0; i < ips.length; i++) {
      if (protocol !== undefined) {
        if (ips[i].family === protocol)
          return ips[i];
      } else {
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
        return '';

      var ipv4 = this.ip('eth0', 'inet');
      return ipv4 == null ? '' : ipv4.address;
    } else {
      // check if we have it already
      if (this.ipv4() != '') {
        callback(null, this.ipv4());
        return;
      }

      // refresh until IPv4 obtained
      var container = this;
      var tries = 0;

      var retryIPv4 = function() {
        container.refresh(function(err) {
          var ipv4 = container.ipv4();

          if (ipv4 == '') {
            // maximum tries (15s)
            if (tries == 15) {
              callback(new OperationError('Exceeded retries', 'Failed', 400));
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
        return '';

      var ipv6 = this.ip('eth0', 'inet6');
      return ipv6 == null ? '' : ipv6.address;
    } else {
      // check if we have it already
      if (this.ipv6() != '') {
        callback(null, this.ipv6());
        return;
      }

      // refresh until IPv6 obtained
      var container = this;
      var tries = 0;

      var retryIPv6 = function() {
        container.refresh(function(err) {
          var ipv6 = container.ipv6();

          if (ipv6 == '') {
            // maximum tries (10s)
            if (tries == 10) {
              callback(new Error('Exceeded retries'));
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

    this._client._request('GET /containers/' + this._metadata.name, {},
      function(err, metadata) {
        if (err) {
          callback(err);
        } else {
          container._metadata = metadata;

          // we now have to a seperate query for state information
          // which we use heavily
          container._client._request(
            'GET /containers/' + container._metadata.name + '/state', {},
            function(err, metadata) {
              if (err) {
                callback(err);
              } else {
                container._metadata.state = metadata;
                callback(err, container);
              }
            });
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
      var stdOut = '';
      var stdErr = '';

      process.on('data', function(isErr, msg) {
        if (isErr) stdErr += msg; else stdOut += msg;
      });

      // handle close
      process.on('close', function() {
        setTimeout(function() {
          _callback(null, stdOut, stdErr);
        }, 10);
      });
    }

    // pass to exec function, but replace callback
    _arguments[_arguments.length - 1] = __callback;
    this.exec.apply(this, arguments);
  },

  /**
   * Executes a terminal command on the container.
   * @param {string[]} command The command with arguments.
   * @param {object?} options The options data, optional.
   * @param {function} callback The callback.
   */
  exec: function(command, options, callback) {
    // callback
    callback = arguments[arguments.length - 1];

    // environment
    if (arguments.length == 2)
      options = {};

    // request
    var container = this;
    var interactive = options.interactive || false;

    this._client._request('POST /containers/' + this.name() + '/exec', {
      'command': command,
      'environment': options.env || {},
      'wait-for-websocket': true,
      'interactive': interactive,
    }, false, function(err, operation) {
      // check for err
      if (err) {
        callback(err);
        return;
      }

      // get metadata
      var md = operation.metadata();

      // socket connect queue
      var wsQueue = new TaskQueue();
      var ws = [];

      for (var i = 0; i < (interactive == true ? 2 : 4); i++) {
        (function(i) {
          wsQueue.queue(function(done) {
            operation.webSocket(
              md.metadata.fds[(i == (interactive == true ? 1 : 3))
                ? 'control'
                : i.toString()], function(err, websocket) {
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
      return this._metadata.state;
    } else {
      // callback
      if (callback === undefined)
        callback = function() {};

      // change state
      var container = this;

      this._client._request('PUT /containers/' + this._metadata.name + '/state',
        {
          'action': state,
          'timeout': timeout,
          'force': true,
        }, function(err, body) {
          if (err) {
            callback(err);
          } else {
            container.refresh(function(err2) {
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
    this.state('start', 30, callback);
  },

  /**
   * Stops the container.
   * @param {function} callback
   */
  stop: function(callback) {
    this.state('stop', 30, callback);
  },

  /**
   * Restarts the container.
   * @param {function} callback
   */
  restart: function(callback) {
    this.state('restart', 30, callback);
  },

  /**
   * Freezes the container.
   * @param {function} callback
   */
  freeze: function(callback) {
    this.state('freeze', 30, callback);
  },

  /**
   * Freezes the container.
   * @param {function} callback
   */
  unfreeze: function(callback) {
    this.state('unfreeze', 30, callback);
  },

  /**
   * Delete the container.
   * @param {function} callback
   */
  delete: function(callback) {
    var deleteQueue = new TaskQueue();

    // if running, stop first
    var error = null;
    var container = this;

    if (this.state().status_code == 103) {
      deleteQueue.queue(function(done) {
        container.stop(function(err) {
          if (err !== null) error = err;
          done();
        });
      });
    }

    // actually delete the container
    deleteQueue.queue(function(done) {
      container._client._request('DELETE /containers/' + container.name(), {},
        function(err, metadata) {
          if (err !== null) error = err;
          done();
        });
    });

    // execute
    deleteQueue.executeAll(function() {
      callback(error);
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
    // create operation
    var operation = this._client._request(
      'POST /containers/' + this.name() + '/files?path=' + remotePath, data,
      function(err, metadata) {
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
    this._client._request(
      'GET_RAW /containers/' + this.name() + '/files?path=' + remotePath, '',
      function(err, metadata) {
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
        callback(new OperationError('File Error', 'Failed', 400, err));
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
      });
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

    // file system wrapper is local only
    this.fs = client.local() ? new ContainerFS(this) : null;
  },
});

// export
module.exports = Container;
