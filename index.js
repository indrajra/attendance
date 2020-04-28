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
var dateFormat = require('dateformat');
const _ = require('lodash')
const httpUtil = require('./sdk/httpUtils.js')
const registryUrl = vars['utilServiceUrl']

var async = require('async');
const keycloakHelper = new KeycloakHelper(vars.keycloak);
var registryService = new RegistryService();

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
    var offlineCourseCompletion = new OfflineCourseCompletion(reqBody.osid, reqBody.name, reqBody.courseName, reqBody.courseCode, reqBody.marks, reqBody.isCompleted, reqBody.isTADAEligible)
    var currentTime = getCurrentTime();
    offlineCourseCompletion.setCourseCompletionTime(currentTime)
    utils.addRecordsToCSV(offlineCourseCompletion);    
    updateTeacherCourseDetail(offlineCourseCompletion);
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

app.post("/update/csv", (req, res) => {
    utils.addRecordsToCSV(attendanceObj);
    res.statusCode = 200
    res.send({ status: "SUCCESSFUL" })
})

//to get list of offline courses
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

//to get offline course completion details of provided user
app.get("/course/completion/:userId", (req, res) => {
    let userId = req.params.userId
    if (userId) {
        let records = utils.getCurrentRecords();
        let filter = _.filter(records, { userId: userId });
        res.statusCode = 200
        res.send(filter)
    } else {
        res.statusCode = 404
        res.send({ errMsg: "Invalid user id" })
    }
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
                if (res) {
                    if (res.params.status === 'SUCCESSFUL') {
                        if (res.result.Course && res.result.Course.length > 0)
                            callback(null, { body: res.result.Course, statusCode: 200 })
                        else {
                            callback(null, { body: { errMsg: "Offline Courses fetch failed" }, statusCode: 500 })
                        }
                    }
                    else if (res.params.status === 'UNSUCCESSFUL') {
                        callback(null, { body: { errMsg: res.params.errmsg }, statusCode: 500 })
                    }
                } else {
                    callback(null, { body: { errMsg: err.code }, statusCode: 500 })
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
    return dateFormat(new Date(), "yyyy-mm-dd'T'h:MM:ss TT")
}
const generateCourseCertificate =(token, req, callback) => {
   
    const options = {
        url: registryUrl + "/create/certificate",
        body: {

            courseName: req.courseName,
            userName: req.userName
        }
    }
    httpUtil.post(options, function (err, res) {
        if (res) {
            callback(null, token, res.body.result.response[0].pdfUrl)
        } else{
            callback(res, null)
        }
    });  
}
const updateTeacherCourseDetail = (req) => {
    async.waterfall([
        function (callback) {
            getTokenDetails(callback)
        },
        function(token, callback){
            generateCourseCertificate(token, req, callback)
        },
        function (token, pdfUrl, callback) {
            if (token) {
                req.certUrl = pdfUrl;
                const teacherReq = {
                    body: {
                        id: "open-saber.registry.read",
                        request: {
                            Teacher: {
                                osid: req.userId,
                            },
                            viewTemplateId: "0f029c54-7e11-11ea-bc55-0242ac130003.json"
                        }
                    },
                    headers: getDefaultHeaders(token)
                }
                registryService.readRecord(teacherReq, function (err, res) {
                    if (res && res.params.status == "SUCCESSFUL") {
                        logger.info("successfully read Teacher course details", res)
                        callback(null, token, res);
                    } else {
                        logger.info("read failed", res)
                        callback(res, null)
                    }
                })
            }
            else {
                callback(new Error("Cannot get token"))
            }
        },
        function (token, readRes, callback) {
            let completedCourse = {
                courseCode: req.courseCode,
                isOnline: false,
                courseName: req.courseName,
                score: req.marks,
                status:req.isCompleted,
                isTADAEligible:req.isTADAEligible,
                certUrl:req.certUrl
            }
            let courses = readRes.result.Teacher.Courses
            if (courses && courses.length > 0) {
                courses.push(completedCourse)
            } else {
                courses = [completedCourse]
            }
            const teacherReq = {
                body: {
                    id: "open-saber.registry.update",
                    request: {
                        Teacher: {
                            osid: req.userId,
                            Courses: courses
                        }
                    }
                },
                headers: getDefaultHeaders(token)
            }
            console.log(JSON.stringify(teacherReq));
            registryService.updateRecord(teacherReq, function (err, res) {
                if (res && res.params.status == "SUCCESSFUL") {
                    callback(null, res)
                } else {
                    callback(res, null)
                }
            })
        }], function (err, result) {
            logger.info('Main Callback --> ' + err + " " + result);
            if (err) {
                logger.debug("err in updating teacher course", err)
            } else {
                logger.info("succesfully  updated teacher course", result)
            }
        });
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
                                viewTemplateId: "0f029c54-7e11-11ea-bc55-0242ac130003.json"
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
                                },
                                viewTemplateId: "0f029c54-7e11-11ea-bc55-0242ac130003.json"
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
                                callback(null, { body: { recordVerified: false, errMsg: "Invalid Teacher code" }, statusCode: 200 })
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