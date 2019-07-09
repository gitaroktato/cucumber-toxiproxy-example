"use strict";
const redis = require("redis");

function doRetry(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      throw new Error('The server refused the connection');
    }
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
    return Math.min(options.attempt * 100, 3000);
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