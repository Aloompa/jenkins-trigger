const bugsnag = require('bugsnag');
const serverless = require('serverless-http');
const app = require('./app');

bugsnag.register(process.env.SLACK_JENKINS_BUGSNAG_KEY);

module.exports.handler = serverless(app);