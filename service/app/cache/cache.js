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
  // const timer = setTimeout(callback, 200, new Error("Request timeout"));
  client.hgetall(userId)(callback);
  client.info()(console.log);
}

function storeUser(client, user) {
  client.hmset(user.id, 'id', user.id, 'name', user.name)();
  client.info()(console.log);
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