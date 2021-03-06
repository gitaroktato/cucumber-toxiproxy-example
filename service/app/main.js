"use strict";
const express = require('express');
const config = require('./config');
const dao = require("./dao");
const cache = require("./cache");
const app = express();

app.use(express.json());

app.get('/users/:userId', function (req, res) {
    const userId = req.params.userId;
    // get from cache
    cache.getUser(app.cacheClient, userId, (err, user) => {
      // Let's ignore error and just try to continue.. What could go wrong?
      if (err) {
        console.error("REDIS error, when getting user - ", err);
      }
      // Check if result has something.
      // thunk-redis returns empty object if key doesn't exist.
      if (user && user.id) {
        console.debug("Loaded from REDIS - %o", user);
        res.set("X-Data-Source", "cache");
        res.json(user);
      } else {
        // get from database
        dao.getUser(app.daoConnection, userId, (err, user) => {
          if (err) {
            console.error("MySQL error, when getting user - ", err);
            return res.sendStatus(503);
          }
          if (!user) {
            return res.sendStatus(404);
          }
          console.debug("Loaded from MySQL - %o", user);
          cache.storeUser(app.cacheClient, user);
          res.set("X-Data-Source", "origin");
          res.json(user);
        });
      }
    });
});

app.put('/users/:userId', function (req, res) {
  const user = req.body;
  user.id = req.params.userId;
  dao.saveUser(app.daoConnection, user, (err) => {
    if (err) {
      console.error("MySQL error, when saving user - ", err);
      return res.sendStatus(503);
    }
    console.debug("Saved user - %o", user);
    cache.evictUser(app.cacheClient, user.id);
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
    app.cacheClient = client;
    startServer(callback);
  });
}

function startDao (config, callback) {
  dao.connect(config.mysql, (error, connection) => {
    if (error) throw error;
    app.daoConnection = connection;
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
