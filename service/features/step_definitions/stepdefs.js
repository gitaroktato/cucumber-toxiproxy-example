"use strict";
const request = require('request');
const assert = require('assert');
const redis = require("thunk-redis");
const mysql = require("mysql");
const { Given, When, Then, Before, BeforeAll, AfterAll } = require('cucumber');
// TODO we can create a separate configuration
// TODO read docker IP from ENV
const SERVICE_URL = 'http://192.168.99.106:8080';
const TOXIPROXY_URL = 'http://192.168.99.106:8474';
const REDIS_BEHIND_PROXY = ["192.168.99.106:6380"];
const MYSQL_BEHIND_PROXY = {
    host: "192.168.99.106",
    port: "3307",
    user: "root",
    password: "letmein"
  };
const TEST_RECOVERY_INTERVAL = 800;
const DEFAULT_TIMEOUT_FOR_SERVICES = 5000;

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

BeforeAll((_, callback) => {
  this.redis = redis.createClient(REDIS_BEHIND_PROXY);
  this.mysql = mysql.createConnection(MYSQL_BEHIND_PROXY);
  this.mysql.connect(callback);
});

function waitUntilConnectionsRecover(callback) {
  setTimeout(callback, TEST_RECOVERY_INTERVAL);
}

Before((_, callback) => {
  this.redis.flushdb()((err) => {
    if (err) {
      return callback(err);
    }
    this.mysql.query("DELETE FROM users.user", (err) => {
      if (err) {
        return callback(err);
      }
      resetToxiproxy(() => {
        waitUntilConnectionsRecover(callback);
      });
    });
  });
});

AfterAll((callback) => {
  this.redis.quit()();
  this.mysql.end();
  resetToxiproxy(callback);
});

Given('user {string} with name {string} is cached', (id, name, callback) => {
  this.redis.hmset(id, 'id', id, 'name', name)(callback);
});

Given('user {string} with name {string} is stored', (id, name, callback) => {
  const query = "INSERT INTO users.user (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?";
  this.mysql.query(query, [id, name, name], (err) => {
    if (err) {
      return callback(err);
    }
    callback();
  });
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
    this.statusCode = res.statusCode;
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

When('we wait a bit', function (callback) {
  setTimeout(callback, 1000);
});

Then('HTTP {int} is returned', function (statusCode) {
  assert.equal(this.statusCode, statusCode);
});

Then('the user with id {string} is returned from {string}', function (userId, dataSource) {
  assert.equal(this.statusCode, 200);
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
