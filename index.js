const express = require("express");
const http = require("http");
const app = express();
var bodyParser = require("body-parser");
var cors = require("cors")
const server = http.createServer(app);
const utils = require('./utils')
const vars = require('./sdk/vars');
const port = vars.attendancePort;
const RegistryService = require('./sdk/RegistryService')
const KeycloakHelper = require('./sdk/KeycloakHelper')
const OfflineCourseCompletion = require('./OfflineCourseCompletion')
const logger = require('./sdk/log4j');

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
    logger.debug("fetchUser start " + JSON.stringify(req.body))
    readRecord(req.body, (err, data) => {
        if (data) {
            res.statusCode = data.statusCode
            res.send(data.body)
        } else {
            res.statusCode = 404
            logger.error("fetchUser " + err);
            res.send({ errMsg: err.message })
        }
    })
})

app.post("/attendance/mark", (req, res) => {
    let reqBody = req.body.request
    var offlineCourseCompletion = new OfflineCourseCompletion(reqBody.osid, reqBody.name, reqBody.courseName, reqBody.courseCode, reqBody.marks)
    var currentTime = getCurrentTime();
    offlineCourseCompletion.setCourseCompletionTime(currentTime)
    utils.addRecordsToCSV(offlineCourseCompletion);
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

app.post("/update/csv", (req, res) => {
    utils.addRecordsToCSV(attendanceObj);
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

app.get("/offline/courses", (req, res) => {
    getOffilneCourses(function (err, data) {
        if (data) {
            res.statusCode = data.statusCode
            res.send(data.body)
        } else {
            res.statusCode = 404
            logger.error("fetch offline course " + err);
            res.send({ errMsg: err.message })
        }
    })
})

const getOffilneCourses = (callback) => {
    async.waterfall([
        function (callback) {
            getTokenDetails(callback)
        },
        function (token, callback) {
            let teacherReq = {
                body: {
                    id: "open-saber.registry.search",
                    request: {
                        entityType: ["Course"],
                        filters: {
                            isOnline: {
                                eq: false
                            }
                        }
                    }
                },
                headers: getDefaultHeaders(token)
            }
            registryService.searchRecord(teacherReq, function (err, res) {
                if (res && res.params.status === 'SUCCESSFUL') {
                    if (res.result.Course && res.result.Course.length > 0)
                        callback(null, { body: res.result.Course, statusCode: 200 })
                    else {
                        callback(null, { body: { errMsg: "Offline Courses fetch failed" }, statusCode: 500 })

                    }
                }
                else if (res.params.status === 'UNSUCCESSFUL') {
                    callback(null, { body: { errMsg: res.params.errmsg }, statusCode: 500 })

                }
            })
        }], function (err, result) {
            if (err) {
                callback(err, null)
            } else {
                callback(null, result);
            }
        });
}


const getCurrentTime = () => {
    return new Date(Date.now()).toISOString()
}

const updateTeacherCourseDetail = () => {

}

const readRecord = (req, callback) => {
    async.waterfall([
        function (callback) {
            getTokenDetails(callback)
        },
        function (token, callback) {
            if (token) {
                const profile = req.request.profile;
                if (profile) { //scan block
                    let teacherReq = {
                        body: {
                            id: "open-saber.registry.read",
                            request: {
                                Teacher: {
                                    osid: profile.substr(profile.lastIndexOf('/') + 1)
                                },
                                viewTemplateId: "attendance.json"
                            }
                        },
                        headers: getDefaultHeaders(token)
                    }
                    registryService.readRecord(teacherReq, function (err, res) {
                        if (res) {
                            if (res.params.status === 'SUCCESSFUL') {
                                let resBody = res.result.Teacher
                                if (resBody.code == req.request.code) {
                                    callback(null, { body: { ...resBody, ...{ recordVerified: true } }, statusCode: 200 })
                                } else {
                                    callback(null, { body: { recordVerified: false, errMsg: "Invalid Teacher code" }, statusCode: 200 })
                                }
                            } else if (res.params.status === 'UNSUCCESSFUL') {
                                callback(null, { body: { errMsg: res.params.errmsg }, statusCode: 500 })
                            }
                        } else {
                            callback(null, { body: { errMsg: err.code }, statusCode: 500 })
                        }
                    })
                } else {
                    //manully entry of code 
                    let teacherReq = {
                        body: {
                            id: "open-saber.registry.search",
                            request: {
                                entityType: ["Teacher"],
                                filters: {
                                    code: {
                                        eq: req.request.code
                                    }
                                }
                            }
                        },
                        headers: getDefaultHeaders(token)
                    }
                    registryService.searchRecord(teacherReq, function (err, res) {
                        if (res && res.params.status === 'SUCCESSFUL') {
                            let resBody = res.result.Teacher
                            if (resBody.length > 0) {
                                if (resBody[0].code == req.request.code) {
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
            } else {
                callback(new Error("Cannot get token"))
            }
        }
    ], function (err, result) {
        logger.info('Main Callback --> ' + err + " " + result);
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
            logger.info("Error in getting token", err)
            callback(null, null);
        }
    });
}

startServer = () => {
    server.listen(port, function () {
        logger.info("Attendance listening on port " + port);
    })
};

startServer()

// if (process.platform === "win32") {
//     var rl = require("readline").createInterface({
//         input: process.stdin,
//         output: process.stdout
//     });

//     rl.on("SIGINT", function () {
//         process.emit("SIGINT");
//     });
// }

// process.on("SIGINT", async function () {
//     // graceful shutdown
//     // FIXME: Save the csv file and then exit.
//     console.log("Getting killed")
//     process.exit();
// });