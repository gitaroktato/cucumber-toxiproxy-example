
// requires
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.local;
const environment = process.env.NODE_ENV || 'local';
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
// log final config
console.log(`Loaded config: ${JSON.stringify(finalConfig)}`);
// Export config
module.exports = finalConfig;
