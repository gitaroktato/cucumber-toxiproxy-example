"use strict";
const express = require('express');
const config = require('./config');
const dao = require("./dao");
const redisClient = require("./cache");
const app = express();

app.get('/getData', function (req, res) {
    const userId = "u-12345abde234";
    // get from cache
    redisClient.hgetall(userId, function (err, user) {
      if (err) throw err;
      if (user) {
        console.log("Loaded from REDIS - %o", user);
        const userAsString = JSON.stringify(user);
        res.end(userAsString);
      } else {
        dao.getUser(userId, user => {
          redisClient.hmset(user.id, user);
          const userAsString = JSON.stringify(user);
          res.end(userAsString);
        });
      }
    });
});

const env = process.env.NODE_ENV || 'local';
config.load(env, (config) => {
  dao.connect(config, () => {
    let startServer = () => {
      const server = app.listen(8080, () => {
        const host = server.address().address;
        const port = server.address().port;
        console.log("Server listening at http://%s:%s", host, port);
      });
    };
    if (config.initSql === true) {
      dao.initTables(startServer);
    } else {
      startServer();
    }
  });
});


