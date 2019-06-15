"use strict";
const dao = require("./dao.js");

module.exports = {
  connect: dao.connect,
  initTables: dao.initTables,
  getUser: dao.getUser
};
