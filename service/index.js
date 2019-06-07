"use strict";
var express = require('express');
var dao = require("./app/dao");
var app = express();
const redisClient = require("./app/cache");

app.get('/getData', function (req, res) {
    // get from cache
    redisClient.hgetall("u-12345abde234", function (err, user) {
      if (user) {
        console.log("Loaded from REDIS - %o", user);
        res.set('Access-Control-Allow-Origin', '*');
        res.end( JSON.stringify(user));
      } else {
        // get from MySQL
        var getUser = "SELECT * FROM users.user WHERE id='u-12345abde234'";
        dao.connection.query(getUser, function (err, result) {
          if (err) throw err;
          console.log("Loaded from MySQL - %o", result);
          // Write to redis
          user = result[0];
          redisClient.hmset(user.id, user);
          res.set('Access-Control-Allow-Origin', '*');
          res.end( JSON.stringify(user));
        });
      }
    });

});

var server = app.listen(8080, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log("Server listening at http://%s:%s", host, port);
});
