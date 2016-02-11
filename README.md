[![npm version](https://badge.fury.io/js/node-lxd.svg)](https://badge.fury.io/js/node-lxd)

A client for communicating with a local or remote instance of linux containers. The interface is object-oriented, simple and uniform.

# Installing

```bash
$ npm install --save node-lxd
```

## Example ##

The following example connects to the local LXC instance and launches a new container.

```js
var lxd = require("node-lxd");

var client = lxd();

client.create("myContainer", "ubuntu", function(err, container) {
    container.start(function(err) {
        if (!err)
            console.log("Started " + container.name());
    });
});
```

## Documentation ##

The client class is documented [here](https://github.com/alandoherty/node-lxd/blob/master/docs/client.md).

The container class is documented [here](https://github.com/alandoherty/node-lxd/blob/master/docs/container.md).