"use strict";
const request = require('request');
const assert = require('assert');
const { Before, After, Given, When, Then } = require('cucumber');
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';

// TODO start service with proxy mode

Before(function (_, callback) {
  request.get(`${TOXIPROXY_URL}/proxies/mysql`, { json: true }, (err, res) => {
    if (err) return callback(err);
    // Already created, should be OK
    // TODO delete?
    if (res.statusCode === 200) return callback();
    const mySqlProxy = {
      name: 'mysql',
      listen: '0.0.0.0:3306',
      upstream: 'mysql:3306',
      enabled: true
    };
    request.post(`${TOXIPROXY_URL}/proxies`,
      { json: true , body: mySqlProxy}, (err, res) => {
      if (err) return callback(err);
      if (res.statusCode !== 201) {
        // Something went wrong, we quit
        return callback(`Got status code after create: ${res.statusCode}`);
      }
      return callback();
    });
  });
});

After(function (callback) {
  request.delete(`${TOXIPROXY_URL}/proxies/mysql`, callback);
});

Given('MySQL is down', function (callback) {
  const mySqlProxy = {
    name: 'mysql',
    enabled: false
  };
  request.post(`${TOXIPROXY_URL}/proxies/mysql`,
    { json: true , body: mySqlProxy}, (err, res) => {
    if (err) return callback(err);
    if (res.statusCode !== 200) {
      return callback(`Got status code after create: ${res.statusCode}`);
    }
    callback();
  });
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

When('new user created with id ... and name ...', function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

Then('HTTP {int} is returned', function (int) {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

Then('the user is returned from Redis', function () {
  assert.equal(this.user.id, 'u-12345abde234');
});
