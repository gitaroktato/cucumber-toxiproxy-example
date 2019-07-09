"use strict";
const redis = require("redis");

function doRetry(options) {
    if (options.total_retry_time > 1000 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      throw new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      throw new Error('Reconnection attempt exhausted');
    }
    // reconnect after
    const reconnectDelay = Math.min(options.attempt * 100, 3000);
    console.warn("REDIS - Reconnecting attempt %d, reconnect after %d ms",
      options.attempt, reconnectDelay);
    return reconnectDelay;
}

// TODO destructuring?
function connect(properties, onConnected) {
  const client = redis.createClient(properties.port, properties.host,
    {retry_strategy: doRetry});
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  client.on("ready", () => {
    onConnected(null, client);
  });
}

function getUser(client, userId, callback) {
  // TODO timeout from config
  const timer = setTimeout(callback, 200, new Error("Request timeout"));
  client.hgetall(userId, function (err, user) {
    clearTimeout(timer);
    return callback(err, user);
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