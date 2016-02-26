/**
     __   _  __ ____
    / /  | |/ // __ \
   / /   |   // / / /
  / /___/   |/ /_/ /
 /_____/_/|_/_____/

 @author Alan Doherty (BattleCrate Ltd.)
 @license MIT
 **/

var index = require("../src/index");
var client = index();
/*
client.launch("myContainer", "ubuntu", function(err, container) {
    if (err) {
        console.error(err.getMessage());
    } else {
        container.ipv4(function(err, ipv4) {
            console.log("started " + container.name() + "(" + ipv4 + ")");
        });
    }
});*/

client.container("myContainer", function(err, container) {
   container.exec(["sleep", "5"], function(err, process) {
      process.resize(1, 1);
      process.on("close", function() {
         console.log("process closed");
      });

      process.on("data", function(isError, msg) {
         (isError ? console.error : console.log)(msg);
      });
   });
});