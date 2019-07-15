"use strict";
const redis = require("thunk-redis");

function connect({hosts, reconnectToMasterMs}, onConnected) {
  const client = redis.createClient(hosts, {onlyMaster: false});
  client.reconnectToMasterMs = reconnectToMasterMs;
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  client.on("warn", function (err) {
    console.warn("Redis warning caught on callback - ", err);
  });
  onConnected(null, client);
}

// TODO move reconnect to separate function


function getUser(client, userId, callback) {
  // TODO timeout from config (when all nodes down)
  client.hgetall(userId)(callback);
}

function reconnectOnReadOnlyError(client, err) {
  if (!err.code || err.code !== 'READONLY') {
    return;
  }
  setTimeout(() => {
    client.clientEnd();
    client.clientConnect();
  }, client.reconnectToMasterMs);
  console.debug("Reconnecting to master after %d ms", client.reconnectToMasterMs);
}

function storeUser(client, user) {
  client.hmset(user.id, 'id', user.id, 'name', user.name)(err => {
    if (err) {
      console.error("Storing user in REDIS failed", err);
      reconnectOnReadOnlyError(client, err);
    }
  });
}

function evictUser(client, userId) {
  client.del(userId)(err => {
    if (err) {
      console.error("Deleting user in REDIS failed", err);
      reconnectOnReadOnlyError(client, err);
    }
  });
}

module.exports = {
  connect: connect,
  getUser: getUser,
  storeUser: storeUser,
  evictUser: evictUser
};