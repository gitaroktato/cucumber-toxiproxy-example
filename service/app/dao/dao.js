"use strict";
const mysql = require("mysql");

// TODO maybe return the error as argument instead of throw?
function multipleSqlCommands(conn, callback, ...args) {
  let currentIndex = 0;
  let sqlCommand = () => {
    let command = args[currentIndex];
    conn.query(command, (error) => {
      if (error) throw error;
      if (currentIndex === args.length - 1) {
        return callback();
      } else {
        currentIndex++;
        sqlCommand();
      }
    });
  };
  sqlCommand();
}

function initTables(conn, callback) {
  const onFinished = () => {
    console.log("Database initialized");
    return callback();
  };
  multipleSqlCommands(conn,
    onFinished,
    "CREATE DATABASE users",
    "CREATE TABLE users.user (id VARCHAR(255), name VARCHAR(255), PRIMARY KEY(id))",
    "INSERT INTO users.user VALUES ('u-12345abde234', 'Bob')");
}

function getUser(conn, id, callback) {
  const query = "SELECT * FROM users.user WHERE id = ?";
  conn.query(query, id, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    const user = result[0];
    callback(null, user);
  });
}

function saveUser(conn, user, callback) {
  const query = "INSERT INTO users.user (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?";
  conn.query(query, user.id, user.name, user.name, (err) => {
    if (err) {
      return callback(err);
    }
    callback();
  });
}

// TODO destructuring?
function connect(properties, callback) {
  const pool = mysql.createPool({
    host: properties.host,
    port: properties.port,
    user: properties.user,
    password: properties.password
  });
  callback(null, pool);
}

module.exports = {
  connect: connect,
  initTables: initTables,
  getUser: getUser,
  saveUser: saveUser,
  multipleSqlCommands: multipleSqlCommands
};
