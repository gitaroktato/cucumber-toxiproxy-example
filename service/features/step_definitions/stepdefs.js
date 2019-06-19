"use strict";
const request = require('request');
const assert = require('assert');
const { Before, After, Given, When, Then } = require('cucumber');
const toxiproxyClient = require("toxiproxy-node-client");
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.100:8474';

// TODO start service with proxy mode


Before(function () {
  const toxiproxy = new toxiproxyClient.Toxiproxy(TOXIPROXY_URL);
  const mySqlProxyName = "mysql";
  const MySQLProxy = {
    listen: "0.0.0.0:3306",
    name: mySqlProxyName,
    upstream: "mysql:3306"
  };
  return toxiproxy.getAll()
    .then(proxies => {
      if (proxies.mysql !== undefined) {
        return proxies.mysql;
      } else {
        return toxiproxy.createProxy(MySQLProxy);
      }
    })
    .then(proxy => this.proxy = proxy);
});

After(function () {
  // return this.proxy.remove();
});

Given('MySQL is down', function () {
  // const toxicBody = {
  //   attributes: {timeout: 5000},
  //   type: 'timeout'
  // };
  // const toxic = new toxiproxyClient.Toxic(this.proxy, toxicBody);
  // return this.proxy.addToxic(this.proxy, toxic);
});


When('user {string} is requested', function (userId, callback) {
  request(SERVICE_URL + `/users/${userId}`, { json: true }, (err, res, body) => {
    if (err) {
      callback(err);
    }
    this.user = body;
    callback(null, 'success');
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
