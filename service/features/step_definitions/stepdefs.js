"use strict";
const request = require('request');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';

function toggleMySql(status, callback) {
  const mySqlProxy = {
    name: 'mysql',
    enabled: status
  };
  request.post(`${TOXIPROXY_URL}/proxies/mysql`,
    { json: true , body: mySqlProxy}, (err, res) => {
    if (err) return callback(err);
    if (res.statusCode !== 200) {
      return callback(`Got status code after update: ${res.statusCode}`);
    }
    callback();
  });
}

Given('MySQL is down', function (callback) {
  toggleMySql(false, callback);
});

When('MySQL is up', function (callback) {
  toggleMySql(true, callback);
});

When('user {string} is requested', function (userId, callback) {
  request(SERVICE_URL + `/users/${userId}`, { json: true }, (err, _, body) => {
    if (err) {
      return callback(err);
    }
    this.user = body;
    callback();
  });
});

When('new user created with id {string} and name {string}', function (userId, name, callback) {
  const user = {
    name: name,
    id: userId
  };
  request.put(SERVICE_URL + `/users/${userId}`, { json: true, body: user }, (err, res) => {
    if (err) {
      return callback(err);
    }
    this.statusCode = res.statusCode;
    callback();
  });
});

Then('HTTP {int} is returned', function (statusCode) {
  assert.equal(this.statusCode, statusCode);
});

Then('the user with id {string} is returned from Redis', function (userId) {
  assert.equal(this.user.id, userId);
});

Then('the user with id {string} is returned from MySQL', function (userId) {
  assert.equal(this.user.id, userId);
});
