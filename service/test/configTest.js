"use strict";
process.env.NODE_ENV = "test";
const config = require('../app/config');
const chai = require('chai');

describe('Should load config', () => {
  it('loads default config', function () {
    chai.assert.deepEqual(config, {
      config_id: 'test',
      mysql: {
        host: "1.2.3.4",
        user: "user",
        password: "password"
      },
      redis: {
        host: "1.2.3.4",
        port: 6379
      },
      initSql: false
    });
  });
});

