# Container

A container object represents a valid LXC container on the connected instance.

## Name

The name of a container can be retrieved by calling `name` on the container with no arguments.

```js
console.log("container name: " + container.name());
```

A container can be renamed by providing a new name and callback function.

```js
container.name("new-name", function(err, newName) {
  console.log("changed to: " + newName);
});
```

## States

To change the state of the container, call `state` and pass either `start, stop, restart, freeze or unfreeze`.

```js
container.state("stop", function(err) {
  if (err != null)
    console.log(container.name() + " has been stopped");
});
```

The container object contains quick functions for the possible states.

```js
container.start(function(err) {});
container.stop(function(err) {});
container.restart(function(err) {});
container.freeze(function(err) {});
container.unfreeze(function(err) {});
```

## Executing programs

Executing programs is done by creating process objects, calling `exec` on a container. The first parameter is an array of argument values, the second is a callback to handle errors or accept the callback.

```js
client.container("myContainer", function(err, container) {
  container.exec(["sleep", "5"], function(err, process) {
    if (err != null) {
      console.error(err);
      return;
    }

    process.on("close", function() {
       console.log("process closed");
    });
  });
});
```

If you don't require standard input functionality, the simplier `run` function may be more suitable for your needs. The parameters are identical to `exec`, but the callback function is called when either an error occurs or the program fully finishes. You should use stdErr to determine if a program exited cleanly as LXD does not provide environment exit codes.

```js
client.container("myContainer", function(err, container) {
  container.run(["echo", "node-lxd is easy to use"], function(err, stdOut, stdErr) {
    if (err != null) console.error(err);
    else {
      console.log("stdOut: " + stdOut);
      console.log("stdErr: " + stdErr);
    }
  });
});
```

## Files

Uploading files to a container is done by calling either `upload` or `uploadFile`. The first takes a string or buffer as an argument, the latter takes a local path. Both functions require the remote path on the container where the file should be written.

```js
container.upload("/root/myFile.txt", "This is a text file", function(err) {
  if (err != null)
    console.log("uploaded text");
});
```

```js
container.uploadFile("myFile.txt", "/root/myFile.txt", function(err) {
  if (err != null)
    console.log("uploaded file");
});
```

Downloading files is done in a similar manner to uploading, calling `download` or `downloadFile`.

```js
container.download("/root/myFile.txt", function(err, data) {
  if (err != null)
    console.log(data);
});
```

```js
container.downloadFile("/root/myFile.txt", "myFile.txt", function(err) {
  if (err != null)
    console.log("downloaded file");
});
```

## Deleting

The container can be deleted by calling `delete` on the object.

```js
container.delete(function(err) {
  if (err != null)
    console.log(container.name() + " deleted!");
});
```

## Network

The network interface can be obtained by passing the interface name, and optionally a protocol to filter by.

```js
var iface = container.ip("eth0", "IPv4");

if (iface != null)
  console.log(iface.address);
```

The container object also provides utility functions to obtain the automatically assigned IPv4/IPv6 addresses. Unlike the `ip` function, the `ipv4` and `ipv6` will always produce a string, which is empty if no address is available yet.

```js
var ipv4 = container.ipv4();
var ipv6 = container.ipv6();
```

If the current operation requires waiting for the IPv4 address to be assigned, a callback can be provided to wait until the address is available. The library will refresh the address every second, up to 15 times until it is obtained. The error field will be populated if a network error occurs or the maximum number of retries is exceeded, otherwise the ip field will contain a string representation of the address.

```js
container.ipv4(function(err, ipv4) {
  if (err)
    console.error("failed to obtain the ipv4 address");
  else
    console.log(container.name() + "'s address is " + ipv4);
});
```

## Refreshing

The state of the container is not automatically refreshed for you, if the latest state of the container is required call the `refresh` function on the container object.

```js
container.refresh(function(err, container) {
  console.log(container.name() + " has " + container.processCount() + " running processes");
});
```
