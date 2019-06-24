"use strict";
const express = require('express');
const config = require('./config');
const dao = require("./dao");
const cache = require("./cache");
const app = express();
var cacheClient;
var daoConnection;

app.get('/users/:userId', function (req, res) {
    const userId = req.params.userId;
    // get from cache
    cache.getUser(cacheClient, userId, (err, user) => {
      if (err) throw err;
      if (user) {
        console.log("Loaded from REDIS - %o", user);
        res.json(user);
      } else {
        // get from database
        dao.getUser(daoConnection, userId, (err, user) => {
          if (err) throw err;
          console.log("Loaded from MySQL - %o", user);
          cache.storeUser(cacheClient, user);
          res.json(user);
        });
      }
    });
});

// TODO independent start by using a function
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


