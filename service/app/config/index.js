"use strict"
// requires
const _ = require('lodash');
var fs = require('fs');
var path = require('path');

function loadConfigFile(fileName) {
  const buffer = fs.readFileSync(path.join(__dirname, fileName));
  return JSON.parse(buffer);
}

function determineEnvironmentConfig(config, environment) {
    const defaultConfig = config.local;
    const environmentConfig = config[environment];
    return _.merge(defaultConfig, environmentConfig);
}

const config = loadConfigFile('config.json');
const environment = process.env.NODE_ENV || 'local';
const finalConfig = determineEnvironmentConfig(config, environment);
// log final config
console.log("Loaded config: %o", finalConfig);
// Export config
module.exports = finalConfig;
