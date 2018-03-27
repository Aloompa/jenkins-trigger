const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const serverless = require('serverless-http');
const request = require('request');

const app = express();

const forceContentType = (req, _res, next) => {
    req.headers['content-type'] = 'application/json';
    next();
};

const SLACK_JENKINS_USER = process.env.SLACK_JENKINS_USER;
const SLACK_JENKINS_PASSWORD = process.env.SLACK_JENKINS_PASSWORD;
const SLACK_ENDPOINT = process.env.SLACK_ENDPOINT;

app.use(cors());
app.use(forceContentType);
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send({
        success: true,
        message: '@aloompa/jenkins-trigger',
        version: require('./package.json').version
    });
});

app.post('/startJob/:job/:token', (req, res) => {
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
            res.status(500)(err);
        }

        if (response.statusCode < 202) {
            return res.send({
                success: true,
                message: 'Triggered Jenkins Job',
                job: job,
                response: response
            });
        }

        res.status(500)({
            success: false,
            message: `Could not trigger the ${job} job.`,
            job: job,
            response: response
        });
    });
});

module.exports = serverless(app);