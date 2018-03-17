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
var url = require('url');
var request = require('request');
var Operation = require('./Operation');
var OperationError = require('./OperationError');
var Container = require('./Container');
var TaskQueue = require('./utilities/TaskQueue');
var Profile = require('./Profile');
var Image = require('./Image');

// the request id (for debugging)
var requestId = 0;

// client
var Client = utils.class_('Client', {
  /**
   * The request.js path for the API.
   * @internal
   */
  _path: '',

  /**
   * The web socket path for the API.
   * @internal
   */
  _wsPath: '',

  /**
   * The lxc info object, cached but not
   * guaranteed to be populated.
   * @internal
   */
  _info: {},

  /**
   * @private
   */
  _local: false,

  /**
   * @private
   */
  _cert: null,

  /**
   * @private
   */
  _key: null,

  /**
   * @private
   */
  _password: false,

  /**
   * Gets if the client is local.
   * @returns {boolean}
   */
  local: function () {
    return this._local;
  },

  /**
   * Get all images
   * @param {boolean?} lazy
   * @param {function} callback
   * @returns {Image[]}
   */
  images: function(lazy, callback) {
    // arguments
    if (arguments.length == 1) {
      callback = arguments[0];
      lazy = false;
    }

    // request
    var client = this;

    this._request('GET /images', {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        // get queue
        var getQueue = new TaskQueue();
        var images = [];

        for (var i = 0; i < body.length; i++) {
          // get image fingerprint
          var fingerprint = body[i].split('/');
          fingerprint = fingerprint[fingerprint.length - 1];

          // queue get operation or push fingerprint if lazy
          if (lazy === true) {
            images.push(fingerprint);
          } else {
            (function (fingerprint) {
              getQueue.queue(function (done) {
                client.image(fingerprint,
                  function (err, image) {
                    // push image, if we error we (assume) that the image
                    // was deleted while downloading, so we don't break everything
                    // by returning an error.
                    if (!err)
                    images.push(image);

                    // done
                    done();
                  });
              });
            })(fingerprint);
          }
        }

        // execute queue
        getQueue.executeAll(function () {
          callback(null, images);
        });
      }

    });
  },


  /**
   * Gets an image with the specified name.
   * @param {string} name
   * @param {function} callback
   */
  image: function (fingerprint, callback) {
    var client = this;

    this._request('GET /images/' + fingerprint, {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        callback(null, new Image(client, body));
      }
    });
  },

  /**
   * Gets all containers.
   * @param {boolean?} lazy
   * @param {function} callback
   * @returns {Container[]}
   */
  containers: function (lazy, callback) {
    // arguments
    if (arguments.length == 1) {
      callback = arguments[0];
      lazy = false;
    }

    // request
    var client = this;

    this._request('GET /containers', {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        // get queue
        var getQueue = new TaskQueue();
        var containers = [];

        for (var i = 0; i < body.length; i++) {
          // get container name
          var name = body[i].split('/');
          name = name[name.length - 1];

          // queue get operation or push name if lazy
          if (lazy === true) {
            containers.push(name);
          } else {
            (function (name) {
              getQueue.queue(function (done) {
                client.container(name,
                  function (err, container) {
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
        getQueue.executeAll(function () {
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
  container: function (name, callback) {
    var client = this;

    this._request('GET /containers/' + name, {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        client._request('GET /containers/' + name + '/state', {},
          function (err, state) {
            if (err) callback(err);
            else {
              body.state = state;
              callback(null, new Container(client, body));
            }
          });
      }
    });
  },

  /**
   * Gets all profiles.
   * @param {boolean?} lazy
   * @param {function} callback
   */
  profiles: function (lazy, callback) {
    // arguments
    if (arguments.length == 1) {
      callback = arguments[0];
      lazy = false;
    }

    // request
    var client = this;

    this._request('GET /profiles', {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        // get queue
        var getQueue = new TaskQueue();
        var profiles = [];

        for (var i = 0; i < body.length; i++) {
          // get profile name
          var name = body[i].split('/');
          name = name[name.length - 1];

          // queue get operation or push name if lazy
          if (lazy === true) {
            profiles.push(name);
          } else {
            (function (name) {
              getQueue.queue(function (done) {
                client.profile(name, function (err, profile) {
                  // push profile, if we error we (assume) that the profile
                  // was deleted while downloading, so we don't break everything
                  // by returning an error.
                  if (!err)
                    profiles.push(profile);

                  // done
                  done();
                });
              });
            })(name);
          }
        }

        // execute queue
        getQueue.executeAll(function () {
          callback(null, profiles);
        });
      }
    });
  },

  /**
   * Gets a profile by the specified name.
   * @param {string} name
   * @param {function} callback
   */
  profile: function (name, callback) {
    var client = this;

    this._request('GET /profiles/' + name, {}, function (err, body) {
      if (err) {
        callback(err);
      } else {
        callback(null, new Profile(client, body));
      }
    });
  },

  /**
   * Authorizes certificate assigned to requests.
   * @param {string} password
   * @param {function} callback
   */
  authorizeCertificate: function (password, callback) {
    this._request('POST /certificates', {
        type: "client",
        password
      },
      function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
  },

  /**
   * Creates a new container and starts it.
   * @param {string} name
   * @param {string} image
   * @param {object?} config
   * @param {string?} profile
   * @param {function?} callback
   * @returns {Operation}
   */
  launch: function (name, image, config, profile, callback) {
    // callback
    callback = arguments[arguments.length - 1];

    if (arguments.length == 4)
      profile = undefined;

    // create and launch
    return this.create(name, image, config, profile,
      function (err, container) {
        if (err) {
          callback(err);
        } else {
          container.start(function (err) {
            if (err) {
              container.delete(function () {
                callback(err);
              });
            } else {
              callback(null, container);
            }
          });
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
  create: function (name, image, config, profile, callback) {
    // callback
    callback = arguments[arguments.length - 1];

    // config
    if (config === undefined)
      config = {};
    if (profile === undefined || arguments.length == 4)
      profile = 'default';

    if (typeof (callback) !== 'function')
      callback = function () {};

    // check name length
    if (name.length == 0) {
      callback(
        new OperationError('Container name too small', 'Failed', 400));
      return null;
    } else if (name.length > 64) {
      callback(
        new OperationError('Container name too long', 'Failed', 400));
      return null;
    }

    // request
    var client = this;

    return this._request('POST /containers', {
      'name': name,
      'architecture': 'x86_64',
      'profiles': [profile],
      'ephemeral': false,
      'config': config,
      'source': typeof image === 'string' ? {
        'type': 'image',
        'alias': image
      } : image,
    }, function (err, operation) {
      if (err) {
        callback(err);
      } else {
        client.container(name, function (err, container) {
          if (err) {
            callback(err);
          } else {
            callback(null, container);
          }
        });
      }
    });
  },

  /**
   * Gets information about the server.
   * callback(err, info)
   * @param {function} callback
   */
  info: function (callback) {
    var client = this;

    this._request('GET /', {}, function (err, body) {
      if (!err)
        client._info = body;

      callback(err, body);
    });
  },

  /**
   * Performs a REST request on this client.
   * @param {string} path
   * @param {object} params
   * @param {boolean?} wait
   * @param {function} callback
   * @returns {Operation}
   * @private
   */
  _request: function (path, params, wait, callback) {
    // wait optionality
    if (arguments.length == 3) {
      callback = arguments[2];
      wait = true;
    }

    // callback
    if (callback === undefined)
      callback = function () {};

    // parse path
    var route = path.substring(path.indexOf(' ') + 1).trim();
    var method = path.substring(0, path.indexOf(' ')).trim();

    if (route[0] == '/')
      route = route.substring(1);

    // increment request id
    requestId++;

    if (process.env.LXDN_DEV == 'true')
      console.log(
        method + ' (' + requestId + ') -> ' + this._path + '1.0' +
        (route.length == 0 ? '' : '/') + route);
    if (typeof (params) === 'object' && !Buffer.isBuffer(params) &&
      process.env.LXDN_DEV == 'true')
      console.log(JSON.stringify(params));

    // check if we shouldn't parse JSON
    var noJSONParse = false;

    if (method.toLowerCase() == 'get_raw') {
      method = 'GET';
      noJSONParse = true;
    }

    // request options
    var options = {
      url: this._path + '1.0' + (route.length == 0 ? '' : '/') + route,
      headers: {
        'Host': ''
      }, // request normally sends weird lxc breaking host header, :?
      method: method,
      json: typeof (params) === 'object' && !Buffer.isBuffer(params),
      rejectUnauthorized: false,
      body: params,
    };

    if (this._cert && this._key) {
      options.cert = this._cert
      options.key = this._key
    }

    // why
    if (Buffer.isBuffer(params) || noJSONParse)
      options.encoding = null;

    // make request
    var client = this;
    var operation = new Operation(this);

    var requestRes = request(options, function (error, response, body) {
      // log finished request
      if (process.env.LXDN_DEV == 'true')
        (error == null ? console.log : console.error)
        ((response == undefined ? 'ERR' : response.statusCode) + ' (' +
          requestId + ') <- ' + client._path + '1.0/' + route);

      // parse buffers
      if (Buffer.isBuffer(body) && !noJSONParse)
        body = body.toString('utf8');

      // parse body if not done already
      if (typeof (body) == 'string' && !noJSONParse)
        body = JSON.parse(body);

      // log json response if available
      if (typeof (body) === 'object' && process.env.LXDN_DEV == 'true')
        console.log(JSON.stringify(body));

      // callback
      if (error !== null) {
        callback(new OperationError('HTTP Error', 'Failed', 400, error));
      } else {
        // handle raw data
        if (typeof (body) !== 'object') {
          callback(null, body);
          return;
        } else if (Buffer.isBuffer(body) && noJSONParse) {
          if (response.statusCode !== 200) {
            body = JSON.parse(body.toString('utf8'));
          } else {
            callback(null, body);
            return;
          }
        }

        // check type
        switch (body.type) {
          case 'async':
            if (body.status_code == 100) {
              // process operation
              operation._process(body);

              // wait for operation
              if (wait) {
                client._request(
                  'GET /operations/' + body.metadata.id +
                  '/wait', {}, function(err, body) {
                    if (err !== null) {
                      callback(
                        new OperationError('HTTP Error',
                          'Failed', 400, error));
                    } else if (body.status_code >= 400 &&
                      body.status_code <= 599) {
                      callback(
                        new OperationError(body.err,
                          body.status,
                          body.status_code));
                    } else {
                      callback(null, body);
                    }
                  });
              } else {
                callback(null, operation);
              }
            } else {
              throw 'async returned non-created status code';
            }

            break;
          case 'sync':
            callback(null, body.metadata);
            break;
          case 'error':
            callback(new OperationError(body.error, body.error,
              body.error_code));
            break;
          default:
            if (process.env.LXDN_DEV)
              console.log(body);
            throw 'unknown operation type: ' + body.type;
        }
      }
    });

    return operation;
  },

  /**
   * Creates a new LXD client.
   * @param {string} host
   */
  constructor: function (host, authenticate) {
    var protocol, hostname, port;
    if (host) {
      var hostUrl = url.parse(host);
      protocol = hostUrl.protocol;
      hostname = hostUrl.hostname;
      port = hostUrl.port;
    }

    // local
    this._local = host === undefined;

    // path
    if (host) {
      this._path = protocol + '//' + hostname;
      this._path += port ? ':' + port + '/' : '/';
    } else {
      this._path = 'http://unix:/var/lib/lxd/unix.socket:/';
    }

    // websocket path
    if (host) {
      this._wsPath = 'ws://' + hostname;
      this._wsPath += port ? ':' + port + '/' : '/';
    } else {
      this._wsPath = 'ws+unix:///var/lib/lxd/unix.socket:/';
    }

    if (authenticate && authenticate.cert && authenticate.key) {
      this._cert = authenticate.cert
      this._key = authenticate.key
    }

    // cache the info, we don't really need it ASAP so we just let it naturally happen
    // in the background
    var client = this;

    this.info(function (err, info) {
      // populate if no error
      if (!err)
        client._info = info;

      if (authenticate && !err && authenticate.cert) {
        client.authorizeCertificate(authenticate.password, function (err) {
          if (err && err._statusCode !== 400) {
            console.error('failed to authorize certificate');
          }
        })
      }
      // debug info
      if (process.env.LXDN_DEV) {
        if (!err) {
          console.log(
            'LXC ' + info.environment.server_version + ' on ' +
            info.environment.kernel + ' using ' +
            info.environment.storage + ' v' +
            info.environment.storage_version);
        } else {
          console.log('failed to retrieve info from lxc');
        }
      }
    });
  },
});

// export
module.exports = Client;
