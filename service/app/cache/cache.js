"use strict";
const redis = require("thunk-redis");

// TODO destructuring?
function connect(properties, onConnected) {
  const client = redis.createClient(properties, {onlyMaster: false, clusterMode: false});
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  client.on("connect", () => {
    onConnected(null, client);
  });
}

function getUser(client, userId, callback) {
  // TODO timeout from config
  client.hgetall(userId)(callback);
}

function storeUser(client, user) {
  client.hmset(user.id, 'id', user.id, 'name', user.name)(err => {
    if (err) console.error("Storing user in REDIS failed", err);
  });
}

function evictUser(client, userId) {
  client.del(userId)(err => {
    if (err) console.error("Deleting user in REDIS failed", err);
  });
}

module.exports = {
  connect: connect,
  getUser: getUser,
  storeUser: storeUser,
  evictUser: evictUser
};