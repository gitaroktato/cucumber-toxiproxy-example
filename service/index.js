'use strict'
var config = require("./config");
var express = require('express');
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

var mysql = require('mysql');

var con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password
});

con.connect(function(err) {
  if (err) throw err;
  // Init DB
  if (config.initSql) {
    initSQL();
  }
});

function initSQL() {
  var createDb = "CREATE DATABASE users";
  con.query(createDb, function (err, result) {
    if (err) throw err;
    console.log("DB created");
  });
  var createTable = "CREATE TABLE users.user (id VARCHAR(255), name VARCHAR(255), PRIMARY KEY(id))";
  con.query(createTable, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
  var insertUser = "INSERT INTO users.user VALUES ('u-12345abde234', 'Bob')";
  con.query(insertUser, function (err, result) {
    if (err) throw err;
    console.log("User created");
  });
}

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
