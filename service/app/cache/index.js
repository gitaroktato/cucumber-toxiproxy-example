const cache = require("./cache");

module.exports = {
    connect: cache.connect,
    getUser: cache.getUser,
    storeUser: cache.storeUser,
    evictUser: cache.evictUser
};
