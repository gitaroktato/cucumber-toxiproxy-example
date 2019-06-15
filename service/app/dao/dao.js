"use strict";
const mysql = require("mysql");

// TODO maybe return the error as argument instead of throw?
function multipleSqlCommands(conn, onFinished, ...args) {
  let currentIndex = 0;
  let sqlCommand = () => {
    let command = args[currentIndex];
    conn.query(command, (error) => {
      if (error) throw error;
      if (currentIndex === args.length - 1) {
        onFinished();
      } else {
        currentIndex++;
        sqlCommand();
      }
    });
  };
  sqlCommand();
}

function initTables(conn, onInitFinished) {
  const onFinished = () => {
    console.log("Database initialized");
    onInitFinished();
  };
  multipleSqlCommands(conn,
    onFinished,
    "CREATE DATABASE users",
    "CREATE TABLE users.user (id VARCHAR(255), name VARCHAR(255), PRIMARY KEY(id))",
    "INSERT INTO users.user VALUES ('u-12345abde234', 'Bob')");
}

// TODO return error?
function getUser(conn, id, onUserLoaded) {
  const query = "SELECT * FROM users.user WHERE id = ?";
  conn.query(query, id, (err, result) => {
    if (err) throw err;
    const user = result[0];
    onUserLoaded(user);
  });
}

function connect(properties, onConnected) {
  const connection = mysql.createConnection({
    host: properties.host,
    user: properties.user,
    password: properties.password
  });
  connection.connect((error) => {
    onConnected(error, connection);
  });
}

module.exports = {
  connect: connect,
  initTables: initTables,
  getUser: getUser,
  multipleSqlCommands: multipleSqlCommands
};
