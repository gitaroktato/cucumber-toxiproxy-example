"use strict";
const request = require('request');
const assert = require('assert');
const { Given, When, Then, Before, AfterAll } = require('cucumber');
// TODO to configuration
const SERVICE_URL = 'http://localhost:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';
const TEST_RECOVERY_INTERVAL = 200;
const DEFAULT_TIMEOUT_FOR_SERVICES = 50000;

function toggleService(name, status, callback) {
  const proxy = {
    name: name,
    enabled: status
  };
  request.post(`${TOXIPROXY_URL}/proxies/${name}`,
    { json: true, body: proxy }, (err, res) => {
      if (err) return callback(err);
      if (res.statusCode !== 200
        && res.statusCode !== 204) {
        return callback(`Got status code after setting ${name} to ${status}: ${res.statusCode}`);
      }
      callback();
    });
}

function timeoutService(name, callback) {
  const toxic = {
    name: 'timeout',
    type: 'timeout',
    attributes: { timeout: DEFAULT_TIMEOUT_FOR_SERVICES }
  };
  request.post(`${TOXIPROXY_URL}/proxies/${name}/toxics`,
    { json: true, body: toxic }, (err, res) => {
      if (err) return callback(err);
      if (res.statusCode !== 200) {
        return callback(`Got status code after updating toxic for ${name}: ${res.statusCode}`);
      }
      callback();
    });
}

function clearTimeoutFor(name, callback) {
  request.del(`${TOXIPROXY_URL}/proxies/${name}/toxics/timeout`,
    { json: true }, (err, res) => {
      if (err) return callback(err);
      if (res.statusCode !== 200
        && res.statusCode !== 404
        && res.statusCode !== 204) {
        return callback(`Got status code after clearing toxic ${name}: ${res.statusCode}`);
      }
      callback();
    });
}

function resetToxiproxy(callback) {
  toggleService('mysql', true, () => {
    toggleService('redis-master', true, () => {
      toggleService('redis-slave', true, () => {
        clearTimeoutFor('redis-master', () => {
          clearTimeoutFor('redis-slave', callback);
        });
      });
    });
  });
}

Before((_, callback) => {
  resetToxiproxy(() => {
    setTimeout(callback, TEST_RECOVERY_INTERVAL);
  });
});

AfterAll((callback) => {
  resetToxiproxy(callback);
});

Given('{string} is down', function (service, callback) {
  toggleService(service.toLowerCase(), false, callback);
});

Given('{string} times out', function (service, callback) {
  timeoutService(service.toLowerCase(), callback);
});

When('{string} is up', function (service, callback) {
  toggleService(service.toLowerCase(), true, callback);
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

function saveUser(userId, name, callback) {
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
}

When('new user created with id {string} and name {string}', saveUser);

When('user is updated with id {string} and name {string}', saveUser);

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

Then('the user with id {string} and name {string} is returned from {string}',
  function (userId, name, dataSource) {
    assert.equal(this.user.id, userId);
    assert.equal(this.user.name, name);
    if (dataSource === "Redis") {
      assert.equal(this.dataSource, "cache");
    } else {
      assert.equal(this.dataSource, "origin");
    }
  });
