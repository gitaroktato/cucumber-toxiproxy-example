"use strict";
const dao = require('../app/dao');
const dao2 = require('../app/dao/dao.js');
const sinon = require('sinon');

beforeEach(() => {
  // Restore the default sandbox here
  sinon.restore();
});


describe('Initalizing tables', () => {
  it('should init tables, when requested', (done) => {
      const stubQuery = sinon.stub();
      stubQuery.callsArg(1);
      // stubQuery.onCall(0).callsArg(1);
      // stubQuery.onCall(1).throws();
      const conn = {
        query: stubQuery
      };
      dao.initTables(conn, () => {
        conn.query.calledWith('CREATE DATABASE users');
        done();
      });
  });
});

describe('Multiple SQL command', () => {
  it('should call multiple SQL commands', (done) => {
      const stubQuery = sinon.stub();
      stubQuery.callsArg(1);
      const conn = {
        query: stubQuery
      };
      let onFinished = () => {
        conn.query.calledWith('ONE');
        conn.query.calledWith('TWO');
        done();
      };
      dao2.multipleSqlCommands(conn, onFinished, "ONE", "TWO");
  });
});

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore();
});
