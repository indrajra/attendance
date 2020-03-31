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
const AttendanceFormat = require('./AttendanceFormat')
const logger = require('./sdk/log4j');
const vars = require('./sdk/vars').getAllVars(process.env.NODE_ENV);
var async = require('async');
const keycloakHelper = new KeycloakHelper(vars.keycloak);
var registryService = new RegistryService();
var _ = require('lodash');

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/attendance/registry/fetchUser", (req, res) => {
    // Given the QR code data in the request, processes and sends back info
    readRecord(req.body, (err, data) => {
        if (data) {
            res.statusCode = data.statusCode
            res.send(data.body)
        } else {
            res.send(err)
        }
    })


})

app.post("/attendance/mark", (req, res) => {
    let reqBody = req.body.request
    var attendanceFormat = new AttendanceFormat(reqBody.osid, reqBody.name, reqBody.orgName)
    var currentTime = getCurrentTime()
    if (attendanceObj.length == 0) {
        attendanceFormat.setEntryTime(currentTime)
        attendanceObj.push(attendanceFormat)
    } else {
        let index = _.findIndex(attendanceObj, function (obj) { return (attendanceFormat.userId == obj.userId && !obj.exitTime) });
        if (index >= 0) { // find index: returns the index of the found element, else -1.
            attendanceObj[index].exitTime = currentTime
            logger.info("updating exit time of id", attendanceObj[index].userId)
        } else {
            attendanceFormat.setEntryTime(currentTime)
            logger.info("adding entry time of id", attendanceFormat.userId)
            attendanceObj.push(attendanceFormat)
        }
    }
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

app.post("/update/csv", (req, res) => {
    utils.addRecordsToCSV(attendanceObj);
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

const getCurrentTime = () => {
    return new Date(Date.now()).toLocaleString([], { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
}

const readRecord = (req, callback) => {
    async.waterfall([
        function (callback) {
            getTokenDetails(callback);
        },
        function (token, callback) {
            const profile = req.request.profile;
            if (profile) { //scan block
                let employeeReq = {
                    body: {
                        id: "open-saber.registry.read",
                        request: {
                            Employee: {
                                osid: profile.substr(profile.lastIndexOf('/') + 1)
                            },
                            viewTemplateId: "1253943a-6fe3-11ea-bc55-0242ac130003.json"
                        }
                    },
                    headers: getDefaultHeaders(token)
                }
                registryService.readRecord(employeeReq, function (err, res) {
                    if (res && res.params.status === 'SUCCESSFUL') {
                        let resBody = res.result.Employee
                        if (resBody.isActive && resBody.empCode == req.request.empCode) {
                            callback(null, { body: { ...resBody, ...{ recordVerified: true } }, statusCode: 200 })
                        } else {
                            callback(null, { body: { recordVerified: false, errMsg: "Invalid Employee code" }, statusCode: 200 })
                        }
                    } else {
                        callback(null, { body: { errMsg: err.code }, statusCode: 500 })
                    }
                })
            } else {
                //manully entry of empCode 
                let employeeReq = {
                    body: {
                        id: "open-saber.registry.search",
                        request: {
                            entityType: ["Employee"],
                            filters: {
                                empCode: {
                                    eq: req.request.empCode
                                }
                            }
                        }
                    },
                    headers: getDefaultHeaders(token)
                }
                registryService.searchRecord(employeeReq, function (err, res) {
                    console.log(err)
                    if (res && res.params.status === 'SUCCESSFUL') {
                        let resBody = res.result.Employee
                        if (resBody.length > 0) {
                            if (resBody[0].isActive && resBody[0].empCode == req.request.empCode) {
                                callback(null, { body: { ...resBody[0], ...{ recordVerified: true } }, statusCode: 200 })
                            } else {
                                callback(null, { body: { recordVerified: false }, statusCode: 200 })
                            }
                        } else {
                            callback(null, { body: { recordVerified: false, errMsg: "Invalid Employee code" }, statusCode: 200 })
                        }

                    } else {
                        callback(null, { body: { errMsg: err.code }, statusCode: 500 })
                    }
                })
            }

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

process.on("SIGINT", async function () {
    // graceful shutdown
    // FIXME: Save the csv file and then exit.
    if (attendanceObj.length > 0) {
        logger.info("saving reocrds to the csv file")
        await utils.addRecordsToCSV(attendanceObj);
    }
    console.log("Getting killed")
    process.exit();
});