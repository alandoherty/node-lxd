# Process

Process represents a running application in an LXD container, you can run multiple processes at the same time and wait on them individually.

## Starting

To run processes you must obtain the `Container` instance.

```js
container.exec(["sleep", "5"], function(err, process) {
  if (err != null) {
    console.error(err);
    return;
  }

  process.on("close", function() {
      console.log("process closed");
  });
});
```

You can find more examples of executing programs in the `Container` documentation.

## Stopping

You can forcibly close a process by calling `close`.

```js
process.close();
```

## Events

You can read data output by using the standard `EventEmitter` subscription functions. The same event is called when data is written to standard output and error.

```js
process.on("data", function(isStdErr, data) {
  if (isStdErr)
    console.error(data);
  else
    console.log(data);
});
```

You can wait for the process to close by hooking the `close` event.

```js
process.on("close", function() {
  console.log("process closed!");
});
```

You can optionally check the `isClosed` method to check if a process has closed.

```js
console.log(process.isClosed());
```

## Resizing

You can resize the virtual terminal attached to the process by calling `resize`. There is no confirmation callback for this operation.

```js
process.resize(300, 400);
```

## Input

You can write to standard input using `write`. You can write raw binary data or UTF8 strings. There is no confirmation callback for this operation.

```js
// write some text
process.write("Alan\n");

// write binary
process.write(new Buffer("UnVzdHkgU3BhdHVsYQ==", "base64"));
```
