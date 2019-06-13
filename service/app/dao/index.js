"use strict";
const mysql = require("mysql");

function initTables(conn, onInitFinished) {
  const createDb = "CREATE DATABASE users";
  conn.query(createDb, function (err) {
    if (err) throw err;
    console.log("DB created");
    const createTable = "CREATE TABLE users.user (id VARCHAR(255), name VARCHAR(255), PRIMARY KEY(id))";
    conn.query(createTable, function (err) {
      if (err) throw err;
      console.log("Table created");
      const insertUser = "INSERT INTO users.user VALUES ('u-12345abde234', 'Bob')";
      conn.query(insertUser, function (err) {
        if (err) throw err;
        console.log("User created");
        onInitFinished();
      });
    });
  });
}

function getUser(id, onUserLoaded) {
  const query = `SELECT * FROM users.user WHERE id=${id}`;
  module.con.query(query, (err, result) => {
    if (err) throw err;
    const user = result[0];
    onUserLoaded(user);
  });
}

function connect(config, onConnected) {
  module.con = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password
  });
  module.con.connect((err) => {
    if (err) throw err;
    onConnected();
  });
}

module.exports = {
  connect: connect,
  initTables: initTables,
  getUser: getUser
};
