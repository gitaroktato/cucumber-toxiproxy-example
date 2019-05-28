"use strict"
const request = require('request');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');
const SERVICE_URL = 'http://localhost:8080/getData';

Given('MySQL is down', function () {
  // TODO
});


When('user {string} is requested', function (string, callback) {
  // Write code here that turns the phrase above into concrete actions
  console.log("Hello");
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
