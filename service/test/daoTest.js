"use strict";
const dao = require('../app/dao');
const daoInternals = require('../app/dao/dao.js');
const sinon = require('sinon');
const chai = require('chai');
var conn;

beforeEach(() => {
  conn = {
    query: sinon.stub()
  };
});


describe('Initalizing tables', () => {
  it('should init tables, when requested', (done) => {     
      conn.query.callsArg(1);
      // stubQuery.onCall(0).callsArg(1);
      // stubQuery.onCall(1).throws();
      dao.initTables(conn, () => {
        chai.assert(conn.query.calledWith('CREATE DATABASE users'));
        done();
      });
  });
});

describe('Multiple SQL command', () => {
  it('should call multiple SQL commands', (done) => {
      conn.query.callsArg(1);
      let onFinished = () => {
        chai.assert(conn.query.calledWith('ONE'));
        chai.assert(conn.query.calledWith('TWO'));
        done();
      };
      daoInternals.multipleSqlCommands(conn, onFinished, "ONE", "TWO");
  });
  it('should throw first error', () => {
    conn.query.onFirstCall().callsArg(1);
    conn.query.onSecondCall().callsArgWith(1, new Error('Connection closed'));
    chai.assert.throws(() => {
        daoInternals.multipleSqlCommands(conn, () => {}, "ONE", "TWO", "THREE");
      },
      'Connection closed' 
    );
    chai.assert(conn.query.calledWith('ONE'));
  });
});

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore();
});
