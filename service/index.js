"use strict"
var config = require("./app/config");
var express = require('express');
var dao = require("./app/dao")
var app = express();

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
        con.query(getUser, function (err, result) {
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

})

var redis = require("redis"),
redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on("error", function (err) {
    throw err;
});


var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Server listening at http://%s:%s", host, port)
})
