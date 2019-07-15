"use strict";
const redis = require("thunk-redis");

// TODO destructuring?
function connect(properties, onConnected) {
  const client = redis.createClient(properties, {onlyMaster: false});
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  onConnected(null, client);
}

function getUser(client, userId, callback) {
  // TODO timeout from config (when all nodes down)
  client.hgetall(userId)(callback);
}

function storeUser(client, user) {
  client.hmset(user.id, 'id', user.id, 'name', user.name)(err => {
    if (err) {
      console.error("Storing user in REDIS failed", err);
      // TODO setTimeout(...) to reconnect to master
      client.clientEnd();
      client.clientConnect();
    }
  });
}

function evictUser(client, userId) {
  client.del(userId)(err => {
    if (err) {
      console.error("Deleting user in REDIS failed", err);
      client.clientConnect();
    }
  });
}

module.exports = {
  connect: connect,
  getUser: getUser,
  storeUser: storeUser,
  evictUser: evictUser
};