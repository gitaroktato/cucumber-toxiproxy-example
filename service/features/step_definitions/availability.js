"use strict"
const request = require('request');
const assert = require('assert');
const { Before, Given, When, Then } = require('cucumber');
const toxiproxyClient = require("toxiproxy-node-client");
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080/getData';
const TOXIPROXY_URL = 'http://192.168.99.100:8474';


Before( async function ()  {
  const toxiproxy = new toxiproxyClient.Toxiproxy(TOXIPROXY_URL);
  const MySQLProxy = {
    listen: "0.0.0.0:3306",
    name: "mysql",
    upstream: "mysql:6379"
  };
  const result = toxiproxy.createProxy(MySQLProxy)
    .then(proxy => {
      this.proxy = proxy;
    })
    .catch(Promise.reject);
  await result;
});

Given('MySQL is down', async function () {
  const toxic = new toxiproxyClient.Toxic(this.proxy, {
    name: 'mysql_down',
    stream: 'downstream',
    toxicity: 1,
    type: 'down'
  });
  const result = this.proxy.addToxic(toxic)
    .then(console.dir)
    .catch(Promise.reject);
  await result;
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
