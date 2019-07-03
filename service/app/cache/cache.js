"use strict";
const redis = require("redis");

// TODO destructuring?
function connect(properties, onConnected) {
  const client = redis.createClient(properties.port, properties.host);
  client.on("error", function (err) {
    onConnected(err, null);
  });
  client.on("ready", () => {
    onConnected(null, client);
  });
}

function getUser(client, userId, callback) {
  client.hgetall(userId, function (err, user) {
    callback(err, user);
  });
}

function storeUser(client, user) {
  client.hmset(user.id, user);
}

function evictUser(client, userId) {
  client.del(userId);
}

module.exports = {
  connect: connect,
  getUser: getUser,
  storeUser: storeUser,
  evictUser: evictUser
};