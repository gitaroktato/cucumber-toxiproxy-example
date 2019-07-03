"use strict";
const cache = require('../app/cache');
const sinon = require('sinon');
const chai = require('chai');
var client;

beforeEach(() => {
  client = {
    del: sinon.stub()
  };
});


describe('Eviction of a specific user', () => {
  it('should call del, when user is evicted', () => {
      const userId = 'u-1235';
      cache.evictUser(client, userId);
      chai.assert.equal(client.del.args[0], userId);
  });
});

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore();
});
