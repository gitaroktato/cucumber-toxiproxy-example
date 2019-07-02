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
      dao.initTables(conn, () => {
        chai.assert(conn.query.calledWith('CREATE DATABASE users'));
        chai.assert(conn.query.calledWithMatch(/CREATE TABLE users.user/));
        chai.assert(conn.query.calledWithMatch(/INSERT INTO users.user/));
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

describe('Querying and saving user', () => {
  it('should query database for user', (done) => {
    const expected = {
      id: 'u-1234',
      name: 'Bob'
    };
    conn.query.callsArgWith(2, null, [expected]);
    dao.getUser(conn, expected.id, (err, user) => {
      chai.assert.isNull(err);
      chai.assert.equal(user, expected);
      chai.assert.equal("SELECT * FROM users.user WHERE id = ?",
        conn.query.getCall(0).args[0]);
      done();
    });
  });
  it('should update user', (done) => {
    const expected = {
      id: 'u-1234',
      name: 'Bob'
    };
    conn.query.callsArgWith(4, null, [expected]);
    dao.saveUser(conn, expected, (err) => {
      chai.assert.isNotTrue(err);
      chai.assert.equal("INSERT INTO users.user (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?",
        conn.query.getCall(0).args[0]);
      done();
    });
  });
});

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore();
});
