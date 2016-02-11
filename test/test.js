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
client.create("myContainer", "ubuntu", function(err, container) {
    if (err) {
        console.error(err.getMessage());
    } else {
        console.log("created " + container.name());
        container.start(function(err) {
            if (!err) {
                console.log("started " + container.name());
                container.ipv4(function(err, ipv4) {

                });
            }
        });
    }
});*/

client.info(function(err, info) {
    console.log(info);
});