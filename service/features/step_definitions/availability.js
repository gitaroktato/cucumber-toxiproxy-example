'use strict'
const http = require('http');
const assert = require('assert');
const { Given, When, Then } = require('cucumber');

Given('MySQL is down', () => {
  // TODO
});


When('user {string} is requested', (string, result) => {
  // Write code here that turns the phrase above into concrete actions
  const req = http.request('http://localhost:8080/getData', res => {
    let responseData = "";
    res.on('data', data => {
      responseData += data;
    });
    res.on('end', () => {
      console.log(responseData);
      result(null, 'success');
    });
  });
  req.on('error', error => {
      console.error(data);
      result(error);
  });
  req.end();
});


Then('the user is returned from Redis', () => {
  // TODO
});
