const config = require("../config");
const redis = require("redis"),
redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on("error", function (err) {
    throw err;
});

module.exports = redisClient;