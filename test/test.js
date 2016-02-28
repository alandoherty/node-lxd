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

/*client.launch("myContainer", "ubuntu", function(err, container) {
    if (err) {
        console.error(err.getMessage());
    } else {
        container.ipv4(function(err, ipv4) {
            console.log("started " + container.name() + "(" + ipv4 + ")");
        });
    }
});*/

client.container("myContainer", function(err, container) {
    container.uploadFile("./test/upload-test.txt", "/root/upload-test.txt", function(err) {
        container.downloadFile("/root/upload-test.txt", "./test/download-test.txt", function(err) {

        });
    });
});