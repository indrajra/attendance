const express = require("express");
const http = require("http");
const app = express();
var bodyParser = require("body-parser");
var cors = require("cors")
const server = http.createServer(app);
const utils = require('./utils')
const port = 7007;
const httpUtil = require('./sdk/httpUtils')
const logger = require('./sdk/log4j');
const vars = require('./sdk/vars').getAllVars(process.env.NODE_ENV);
const KeycloakHelper = require('./sdk/KeycloakHelper');
const keycloakHelper = new KeycloakHelper(vars.keycloak);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/attendance/registry/fetchUser", (req, res) => {
    // Given the QR code data in the request, processes and sends back info
})

app.post("/attendance/mark", (req, res) => {
    console.log(req.body)
    const reqBody = {

    }

    getTokenDetails((err, token) => {

    })

    httpUtil.post()

    // has logic to do entry or exit.
    // one user can have multiple entries and exits per day.
    res.send("hrlloo")
})


/**
 * returns user token and caches if token is not cached
 * @param {*} req 
 * @param {*} callback 
 */
const getTokenDetails = (rcallback) => {
    cacheManager.get('usertoken', function (err, tokenData) {
        if (err || !tokenData) {
            keycloakHelper.getToken(function (err, token) {
                if (token) {
                    cacheManager.set({ key: 'usertoken', value: { authToken: token } }, function (err, res) { });
                    callback(null, 'Bearer ' + token.access_token.token);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(null, 'Bearer ' + tokenData.authToken.access_token.token);
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