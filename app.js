const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const bugsnag = require('bugsnag');

const app = express();

const SLACK_JENKINS_USER = process.env.SLACK_JENKINS_USER;
const SLACK_JENKINS_PASSWORD = process.env.SLACK_JENKINS_PASSWORD;
const SLACK_ENDPOINT = process.env.SLACK_ENDPOINT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bugsnag.requestHandler);
app.use(bugsnag.errorHandler);

app.get('/', (req, res) => {
    res.send({
        success: true,
        message: '@aloompa/jenkins-trigger'
    });
});

app.post('/startJob/:job/:token', (req, res) => {
    if (!req.body.text) {
        return send({
            success: false,
            message: 'There is no text in the body'
        });
    }

    const job = req.params.job;
    const token = req.params.token;
    const text = req.body.text.split(' ');
    const params = text.reduce((prev, current, index) => {
        return `${prev}&PARAM_${index}=${current}`;
    }, '');
    
    const uri = `https://${SLACK_JENKINS_USER}:${SLACK_JENKINS_PASSWORD}@${SLACK_ENDPOINT}/buildByToken/buildWithParameters?job=${job}&token=${token}${params}`;

    request({
        uri: uri,
        method: 'POST'
    }, (err, response) => {
        if (err) {
            bugsnag.notify(err);
            return res.send(`Oops! I couldn't start the ${job} job with these params: ${params}`);
        }

        return res.send(`Kicked off the ${job} job with these params: ${params}!`);
    });
});

module.exports = app;