"use strict";
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const CONFIG_FILE_NAME = 'config.json';

function determineEnvironmentConfig(config, environment) {
    const defaultConfig = config.local;
    const environmentConfig = config[environment];
    return _.merge(defaultConfig, environmentConfig);
}

function loadAsync(environment, callback) {
  const configFilePath = path.join(__dirname, CONFIG_FILE_NAME);
  fs.readFile(configFilePath, function (err, buffer) {
    if (err) {
      console.error(err);
      throw err;
    }
    const configJson = JSON.parse(buffer);
    const result = determineEnvironmentConfig(configJson, environment);
    console.log("Loaded config: %o", result);
    callback(result);
  });
}

module.exports = {
  loadAsync: loadAsync,
  determineEnvironmentConfig: determineEnvironmentConfig
};
