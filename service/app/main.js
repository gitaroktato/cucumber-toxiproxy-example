"use strict";
const express = require('express');
const config = require('./config');
const dao = require("./dao");
const cache = require("./cache");
const app = express();
var cacheClient;
var daoConnection;

app.get('/getData', function (req, res) {
    const userId = "u-12345abde234";
    // get from cache
    cacheClient.hgetall(userId, function (err, user) {
      if (err) throw err;
      if (user) {
        console.log("Loaded from REDIS - %o", user);
        const userAsString = JSON.stringify(user);
        res.end(userAsString);
      } else {
        dao.getUser(daoConnection, userId, user => {
          console.log("Loaded from MySQL - %o", user);
          cacheClient.hmset(user.id, user);
          const userAsString = JSON.stringify(user);
          res.end(userAsString);
        });
      }
    });
});

// TODO independent start?
let startServer = () => {
  const server = app.listen(8080, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
  });
};

let startCache = (config) => {
  cache.connect(config.redis, (error, client) => {
    if (error) throw error;
    cacheClient = client;
    startServer();
  });
};

let startDao = (config) => {
  dao.connect(config.mysql, (error, connection) => {
    if (error) throw error;
    daoConnection = connection;
    if (config.initSql === true) {
      dao.initTables(connection, () => {
        startCache(config);
      });
    } else {
      startCache(config);
    }
  });
};

const env = process.env.NODE_ENV || 'local';
config.load(env, (config) => {
  startDao(config);  
});


