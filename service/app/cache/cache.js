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
  initiateScheduledPing(client);
  onConnected(null, client);
}

function reconnect(client) {
  client.clientEnd();
  client.clientConnect();
}

function pingWithTimeout(client, timeout, callback) {
  const onPingTimeout = setTimeout(() => {
    callback(new Error(`Ping timed out after ${timeout}ms`));
  }, timeout);
  client.ping()((err) => {
    clearTimeout(onPingTimeout);
    console.debug(`${Date.now()} - ping`);
    callback(err);
  });
}

function initiateScheduledPing(client) {
  const schedulePingMs = 1000;
  const pingTimeoutMs = 800;
  setInterval(() => {
    pingWithTimeout(client, pingTimeoutMs, (err) => {
      if (err) {
        console.error("Ping failed, reconnecting:", err);
        reconnect(client);
      }
    });
  }, schedulePingMs);
}

function getUser(client, userId, callback) {
  // TODO timeout from config (when all nodes down)
  client.hgetall(userId)(callback);
}

function reconnectOnReadOnlyError(client, err) {
  if (!err.code || err.code !== 'READONLY') {
    return;
  }
  // TODO schedule only one timeout (stateful functions?)
  setTimeout(() => {
    reconnect(client);
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