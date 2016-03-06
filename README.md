[![npm version](https://badge.fury.io/js/node-lxd.svg)](https://badge.fury.io/js/node-lxd)

A client for communicating with a local or remote instance of linux containers. The interface is object-oriented, simple and uniform.

# Installing

```bash
$ npm install --save node-lxd
```

## Getting Started ##

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

## Example ##

The following example uses an express application to allow users to create containers and execute commands.

```js
// requires
var express = require("express");
var lxd = require("node-lxd");
var client = lxd();
var app = express();

var containers = {};

app.get("/create", function(req, res) {
	client.launch(req.query.name, function(err, container) {
		if (err) res.json({success: false, message: err.getMessage()});
		else {
			containers[req.query.name] = container;
			res.json({success: true, message: "Container launched"});
		}
	});
});

app.get("/run", function(req, res) {
	if (!containers.hasOwnProperty(req.query.name)) {
		res.json({success: false, message: "Container does not exist"});
		return;
	}

	containers[req.query.name].run(req.query.cmd.split(" "), function(err, stdOut, stdErr) {
		if (err) res.json({success: false, message: err.getMessage()});
		else if (stdErr.length > 0) res.json({success: false, message: stdErr});
		else {
			res.json({success: true, message: stdOut});
		}
	});
});

app.listen(3000, function(err) {
	if (!err)
		console.log("listening on port 3000");
});
```

## Documentation ##

The client class is documented [here](https://github.com/alandoherty/node-lxd/blob/master/docs/client.md).

The container class is documented [here](https://github.com/alandoherty/node-lxd/blob/master/docs/container.md).
