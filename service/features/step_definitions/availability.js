"use strict"
const request = require('request');
const assert = require('assert');
const { Before, Given, When, Then } = require('cucumber');
const toxiproxyClient = require("toxiproxy-node-client");
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080/getData';
const TOXIPROXY_URL = 'http://192.168.99.100:8474';


Before(function () {
  const toxiproxy = new toxiproxyClient.Toxiproxy(TOXIPROXY_URL);
  const mySqlProxyName = "mysql"
  const MySQLProxy = {
    listen: "0.0.0.0:3306",
    name: mySqlProxyName,
    upstream: "mysql:6379"
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

Given('MySQL is down', function () {
  return this.proxy.update({
    enabled: false
  });
});


When('user {string} is requested', function (string, callback) {
  // Write code here that turns the phrase above into concrete actions
  request(SERVICE_URL, { json: true }, (err, res, body) => {
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
  //
  assert.equal(this.user.id, 'u-12345abde234');
});
