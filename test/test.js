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

var index = require('../src/index');
var client = index();
var TaskQueue = require('../src/classes/utilities/TaskQueue');
var testQueue = new TaskQueue();

process.env.TEST = true;

/**
 * Test launching.
 */
var container = null;

testQueue.queue(function(done) {
  console.log('[test] launching myContainer');
  client.launch('myContainer', 'ubuntu', function(err, container_) {
    if (err) console.error('[test] ' + err.getMessage());
    else {
      container = container_;
      done();
    }
  });
});

/**
 * Test stopping.
 */
testQueue.queue(function(done) {
  console.log('[test] stopping myContainer');
  container.stop(function(err) {
    if (err) console.error('[test] ' + err.getMessage());
    else done();
  });
});

/**
 * Test starting.
 */
testQueue.queue(function(done) {
  console.log('[test] starting myContainer');
  container.start(function(err) {
    if (err) console.error('[test] ' + err.getMessage());
    else done();
  });
});

/**
 * Obtaining IPv4
 */
testQueue.queue(function(done) {
  console.log('[test] obtaining myContainer ipv4');
  container.ipv4(function(err, ipv4) {
    if (err) console.error('[test] ' + err.getMessage());
    else {
      console.log('[test] obtained ipv4 of ' + ipv4);
      done();
    }
  });
});

/**
 * Execute ls.
 */
testQueue.queue(function(done) {
  console.log('[test] running \'ls\'');
  container.run(['ls', '/'], function(err, stdOut, stdErr) {
    if (err) console.error('[test] ' + err.getMessage());
    else {
      console.log('stdOut', stdOut);
      console.error('stdErr', stdErr);
      setTimeout(function() {
        done();
      }, 0);
    }
  });
});

/**
 * Test stopping.
 */
testQueue.queue(function(done) {
  console.log('[test] stopping myContainer');
  container.stop(function(err) {
    if (err) console.error('[test] ' + err.getMessage());
    else done();
  });
});

/**
 * Test deleting.
 */
testQueue.queue(function(done) {
  console.log('[test] deleting myContainer');
  container.delete(function(err) {
    if (err) console.error('[test] ' + err.getMessage());
    else done();
  });
});

/**
 * Local testing/remote testing
 */
if (process.env.LXDN_DEV) {
  client.container('crate-1', function(err, container) {
    if (err) throw err;
  });
} else {
  testQueue.executeAll(function() {
    console.log('[test] all tests successful');
  });
}
