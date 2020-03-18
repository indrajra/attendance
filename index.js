const express = require("express");
const http = require("http");
const app = express();
var bodyParser = require("body-parser");
var cors = require("cors")
const server = http.createServer(app);
const utils = require('./utils')
const port = 7007;

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/attendance/registry/fetchUser", (req, res) => {
    // Given the QR code data in the request, processes and sends back info
})

app.post("/attendance/mark", (req, res) => {
    // has logic to do entry or exit.
    // one user can have multiple entries and exits per day.

})

startServer = () => {
    server.listen(port, function () {
        console.log("Attendance listening on port " + port);
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