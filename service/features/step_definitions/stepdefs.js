"use strict";
const request = require('request');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';

function toggleService(name, status, callback) {
  const proxy = {
    name: name,
    enabled: status
  };
  request.post(`${TOXIPROXY_URL}/proxies/${name}`,
    { json: true , body: proxy}, (err, res) => {
    if (err) return callback(err);
    if (res.statusCode !== 200) {
      return callback(`Got status code after update: ${res.statusCode}`);
    }
    callback();
  });
}

Given('MySQL is down', function (callback) {
  toggleService('mysql', false, callback);
});

Given('Redis master is down', function (callback) {
  toggleService('redis-master', false, callback);
});

When('MySQL is up', function (callback) {
  toggleService('mysql', true, callback);
});

When('user {string} is requested', function (userId, callback) {
  request(SERVICE_URL + `/users/${userId}`, { json: true }, (err, res, body) => {
    if (err) {
      return callback(err);
    }
    this.user = body;
    this.dataSource = res.headers['x-data-source'];
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

Then('the user with id {string} is returned from {string}', function (userId, dataSource) {
  assert.equal(this.user.id, userId);
  if (dataSource === "Redis") {
    assert.equal(this.dataSource, "cache");
  } else {
    assert.equal(this.dataSource, "origin");
  }
});
