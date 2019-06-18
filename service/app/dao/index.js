"use strict";
const dao = require("./dao.js");

// TODO reduce public interface, remove connection?
module.exports = {
  connect: dao.connect,
  initTables: dao.initTables,
  getUser: dao.getUser
};
