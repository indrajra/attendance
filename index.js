const express = require("express");
const http = require("http");
const app = express();
var bodyParser = require("body-parser");
var cors = require("cors")
const server = http.createServer(app);
const port = 7007;

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/attedance/fetchUser", (req, res) => {
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

startServer()