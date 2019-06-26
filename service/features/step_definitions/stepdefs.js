"use strict";
const request = require('request');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';

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
    console.debug("Proxy disabled %o", res.body);
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
