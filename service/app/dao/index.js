"use strict"
const config = require('../config');
const mysql = require('mysql');

const con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password
});

con.connect(function(err) {
  if (err) throw err;
  // Init DB
  if (config.initSql) {
    initSQL();
  }
});

function initSQL() {
  var createDb = "CREATE DATABASE users";
  con.query(createDb, function (err, result) {
    if (err) throw err;
    console.log("DB created");
  });
  var createTable = "CREATE TABLE users.user (id VARCHAR(255), name VARCHAR(255), PRIMARY KEY(id))";
  con.query(createTable, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
  var insertUser = "INSERT INTO users.user VALUES ('u-12345abde234', 'Bob')";
  con.query(insertUser, function (err, result) {
    if (err) throw err;
    console.log("User created");
  });
}

module.exports.connection = con;
