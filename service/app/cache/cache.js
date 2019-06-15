"use strict";
const redis = require("redis");

function connect(properties, onConnected) {
  const client = redis.createClient(properties.port, properties.host);
  client.on("error", function (err) {
    onConnected(err, null);
  });
  client.on("ready", () => {
    onConnected(null, client);
  });
}

module.exports = {
  connect: connect
};