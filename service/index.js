"use strict";
const main = require('./app/main.js');

const env = process.env.NODE_ENV || 'local';
main.start('cucumber', () => {});
