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

function pingWithTimeout(client, timeout) {
  const onPingTimeout = setTimeout(() => {
    callback(new Error("Ping timed out"));
  }, 500);
  client.ping()((err) => {
    console.debug(`${Date.now()} - ping`);
    clearTimeout(onPingTimeout);
    callback(err);
  });
}

// TODO move reconnect to separate function
function initiateScheduledPing(client) {
  const doPing = () => {
    const onPingTimeout = setTimeout(() => {
      console.error("Ping timeout, reconnecting");
      reconnect(client);
      setTimeout(doPing, 500);
    }, 500);
    client.ping()((err) => {
      console.debug(`${Date.now()} - ping`);
      if (err) {
        console.error("Ping failed, reconnecting", err);
        reconnect(client);
      }
      clearTimeout(onPingTimeout);
      setTimeout(doPing, 500);
    });
  };
  setTimeout(doPing, 500);
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