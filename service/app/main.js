"use strict";
const express = require('express');
const config = require('./config');
const dao = require("./dao");
const cache = require("./cache");
const app = express();
var cacheClient;
var daoConnection;

app.use(express.json());

app.get('/users/:userId', function (req, res) {
    const userId = req.params.userId;
    // get from cache
    cache.getUser(cacheClient, userId, (err, user) => {
      if (err) throw err;
      if (user) {
        console.log("Loaded from REDIS - %o", user);
        res.set("X-Data-Source", "cache");
        res.json(user);
      } else {
        // get from database
        dao.getUser(daoConnection, userId, (err, user) => {
          if (err) throw err;
          console.log("Loaded from MySQL - %o", user);
          cache.storeUser(cacheClient, user);
          res.set("X-Data-Source", "origin");
          res.json(user);
        });
      }
    });
});

app.put('/users/:userId', function (req, res) {
  const user = req.body;
  user.id = req.params.userId;
  dao.saveUser(daoConnection, user, (err) => {
    if (err) {
      return res.sendStatus(503);
    }
    console.log("Saved user - %o", user);
    res.sendStatus(200);
  });
});

// TODO independent start from each other?
function startServer (callback) {
  const server = app.listen(8080, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
    callback();
  });
}

function startCache (config, callback) {
  cache.connect(config.redis, (error, client) => {
    if (error) throw error;
    cacheClient = client;
    startServer(callback);
  });
}

function startDao (config, callback) {
  dao.connect(config.mysql, (error, connection) => {
    if (error) throw error;
    daoConnection = connection;
    if (config.initSql === true) {
      dao.initTables(connection, () => {
        startCache(config, callback);
      });
    } else {
      startCache(config, callback);
    }
  });
}

module.exports = {
  start: function (env, onCompleted) {
    config.load(env, (config) => {
      startDao(config, onCompleted);  
    });
  }
};
