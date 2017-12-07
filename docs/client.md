# Client

Clients manage a connection to an LXC instance, either locally or remotely.

## Connection

To create a new client on the local domain socket, require and call `node-lxd` without any arguments. No data is sent until an action is performed, so you can't be sure the connection was successful until you attempt an action.

```js
var lxd = require("node-lxd");
var client = lxd();
```

To connect to a remote client, specify the protocol (http || https), host and port by passing it to the `node-lxd`.

```js
var lxd = require("node-lxd");
var client = lxd("https://instance.mycompany.io:1234");
```

You can also authenticate to your server with certificate and key:
```js
var lxd = require("node-lxd");
var client = lxd("https://instance.mycompany.io:1234", {
    cert: fs.readFileSync(__dirname + '/cert.pem'),
    key: fs.readFileSync(__dirname + '/key.pem'),
    password: 'password' // password to lxd server
});
```

## Errors

Throughout the `node-lxd` docs, most callback functions will provide an err parameter. This is either `null` if no error occured, or an `OperationError` if the command failed. The client provides the error message and status information provided by `lxd`.

```js
function callback(err, ...) {
  console.error(err.getMessage());
  console.error(err.getStatus());
  console.error(err.getStatusCode());
}
```

## Containers

Containers are a form of virtualization that creates a mini-environment ontop of your existing operating system, with near bare metal speeds. Unlike other virtualisation techniques, the programs run on the host operating system, resulting in faster performance, efficency and boot times.

### Creating

To create a container, call `create` on your newly connected client. You will need to setup some images prior, follow the tutorials on the LXD website to do so. I'll assume you've imported the `ubuntu` image throughout this doc. The first argument specifies a 64-character ASCII name for the container, the second contains the image name.

```js
client.create("container-name", "ubuntu", function(err, container) {
  if (err) {
    console.error(err.getMessage());
  } else {
    console.log(container.name() + " created!");
  }
});
```

For simplicity, call `launch` to both create and start a container.

```js
client.launch("container-name", "ubuntu", function(err, container) {
  if (err) {
    console.error(err.getMessage());
  } else {
    console.log(container.name() + " started!");
  }
});
```

You can also pass standard LXD configuration by providing the configuration parameter to either `launch` or `create`.

```js
client.launch("container-name", "ubuntu", {
  "limits.memory" : "512MB"
}, function(err, container) {
  if (err) {
    console.error(err.getMessage());
  } else {
    console.log(container.name() + " started with 512MB (hard limit)!");
  }
});
```

It is also possible to pass own source according to lxd rest api:

```js
client.launch("container-name", {
  "type": "image",                             // Can be: "image", "migration", "copy" or "none"
  "mode": "pull",                              // One of "local" (default) or "pull"
  "server": "https://10.0.2.3:8443",           // Remote server (pull mode only)
  "protocol": "lxd",                           // Protocol (one of lxd or simplestreams, defaults to lxd)
  "certificate": "PEM certificate",            // Optional PEM certificate. If not mentioned, system CA is used.
  "alias": "ubuntu/devel"
}, {
  "limits.memory" : "512MB"
}, function(err, container) {
  if (err) {
    console.error(err.getMessage());
  } else {
    console.log(container.name() + " started with 512MB (hard limit)!");
  }
});
```

### Get container

To get a container by name, call `container` and pass the name of the container. If successful, container will be a `Container` object.

```js
client.container("container-name", function(err, container) {
  console.log("container's ip: " + container.ipv4());
});
```

### Get containers

To list all the containers on an instance, call `containers`. If you have more than five or ten containers, you should call this function lazily, which only downloads the names of the containers instead of their status.

```js
client.containers(function(err, containers) {
  for (var i = 0; i < containers.length; i++) {
    console.log(containers[i].name()); // containers are actual objects
  }
});
```

or lazily:

```js
client.containers(true, function(err, containers) {
  for (var i = 0; i < containers.length; i++) {
    console.log(containers[i]); // containers are just names
  }
});
```

## Info

To get information about the LXC instance the client is connected to, call `info`.

```js
client.info(function(err, info) {
  console.log(info);
});
```

This returns an object of this format:

```js
{
    api_compat:1,
    auth:'trusted',
    config:{ },
    environment:{
        addresses:[],
        architectures:[ 2, 1 ],
        driver:'lxc',
        driver_version:'2.0.0.beta2',
        kernel:'Linux',
        kernel_architecture:'x86_64',
        kernel_version:'3.19.0-25-generic',
        server:'lxd',
        server_pid:4153,
        server_version:'2.0.0.beta1',
        storage:'btrfs',
        storage_version:'3.12'
    }
}
```
