const http = require('http');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');

Given('MySQL is down', function () {
  // TODO
});


When('user {string} is requested', function (string) {
  // Write code here that turns the phrase above into concrete actions
  const req = http.request('http://localhost:8080/getData', response => {
    console.dir(response);
  }).on('error', err => {
    throw err;
  });
  req.end();
});


Then('the user is returned from Redis', function () {
  // TODO
});
