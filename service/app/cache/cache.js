"use strict";
const redis = require("thunk-redis");

function connect(
  {
    hosts,
    reconnectToMasterMs,
    pingIntervalMs,
    pingTimeoutMs,
    callTimeoutMs
  },
  callback) {
  const client = redis.createClient(hosts, {onlyMaster: false});
  client.reconnectToMasterMs = reconnectToMasterMs;
  client.pingIntervalMs = pingIntervalMs;
  client.pingTimeoutMs = pingTimeoutMs;
  client.callTimeoutMs = callTimeoutMs;
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  client.on("warn", function (err) {
    console.warn("Redis warning caught on callback - ", err);
  });
  initiateScheduledPing(client);
  callback(null, client);
}

function reconnect(client) {
  client.clientEnd();
  client.clientConnect();
}

function callWithTimeout(method, timeout, callback) {
  let timeoutTriggered = false;
  const afterTimeout = setTimeout(() => {
    timeoutTriggered = true;
    callback(new Error(`Execution timed out after ${timeout}ms`));
  }, timeout);
  method((...args) => {
    clearTimeout(afterTimeout);
    // We avoid sending callbacks multiple times.
    if (!timeoutTriggered) {
      return callback(...args);
    }
  });
}

function initiateScheduledPing(client) {
  setInterval(() => {
    callWithTimeout(client.ping(), client.pingTimeoutMs, (err) => {
      if (err) {
        console.error("Ping failed, reconnecting:", err);
        reconnect(client);
      }
    });
  }, client.pingIntervalMs);
}

function getUser(client, userId, callback) {
  callWithTimeout(client.hgetall(userId), client.callTimeoutMs, callback);
}

function reconnectOnReadOnlyError(client, err) {
  if (!err.code || err.code !== 'READONLY') {
    return;
  }
  // TODO schedule only one timeout (stateful monads?)
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