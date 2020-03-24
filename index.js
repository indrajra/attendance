const express = require("express");
const http = require("http");
const app = express();
var bodyParser = require("body-parser");
var cors = require("cors")
const server = http.createServer(app);
const utils = require('./utils')
const port = 7007;
const RegistryService = require('./sdk/RegistryService')
const KeycloakHelper = require('./sdk/KeycloakHelper')
const logger = require('./sdk/log4j');
const vars = require('./sdk/vars').getAllVars(process.env.NODE_ENV);
var async = require('async');
const keycloakHelper = new KeycloakHelper(vars.keycloak);
var registryService = new RegistryService();

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/attendance/registry/fetchUser", (req, res) => {
    // Given the QR code data in the request, processes and sends back info
    readRecord(req.body, (err, data) => {
        if (data) {
            res.statusCode = 200
            res.send(data)
        } else {
            res.send(err)
        }
    })


})

app.post("/attendance/mark", (req, res) => {

    // has logic to do entry or exit.
    // one user can have multiple entries and exits per day.
})


const readRecord = (req, callback) => {
    async.waterfall([
        function (callback) {
            getTokenDetails(callback);
        },
        function (token, callback) {
            const profile = req.request.profile;
            let employeeReq = {
                body: {
                    id: "open-saber.registry.read",
                    request: {
                        Employee: {
                            osid: profile.substr(profile.lastIndexOf('/') + 1)
                        }
                    }
                },
                headers: getDefaultHeaders(token)
            }
            registryService.readRecord(employeeReq, function (err, res) {
                if (res && res.params.status === 'SUCCESSFUL') {
                    if (res.result.Employee.isActive && res.result.Employee.empCode == req.request.empCode) {
                        callback(null, { body: { recordVerified: true }, statusCode: 200 })
                    } else {
                        callback(null, { body: { recordVerified: false }, statusCode: 200 })
                    }
                } else {
                    callback({ body: { errMsg: err }, statusCode: 500 }, null)
                }
            })
        }
    ], function (err, result) {
        logger.info('Main Callback --> ' + result);
        if (err) {
            callback(err, null)
        } else {
            callback(null, result);
        }
    });
}

const getDefaultHeaders = (token) => {
    let headers = {
        'content-type': 'application/json',
        'accept': 'application/json',
        'authorization': token
    }
    return headers;
}


/**
 * returns user token
 * @param {*} req 
 * @param {*} callback 
 */
const getTokenDetails = (callback) => {
    keycloakHelper.getToken(function (err, token) {
        if (token) {
            callback(null, 'Bearer ' + token.access_token.token);
        } else {
            logger.info("error in generating token", err)
            callback(err);
        }
    });
}

startServer = () => {
    server.listen(port, function () {
        logger.info("Attendance listening on port " + port);
    })
};

var attendanceObj = utils.getTodayAttendance()

startServer()

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    // graceful shutdown
    // FIXME: Save the csv file and then exit.
    console.log("Getting killed")
    process.exit();
});