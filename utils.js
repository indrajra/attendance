/**
 * Utility functions to aid in attendance marking
 */
var dateFormat = require('dateformat')
var fs = require("fs")
const reportsFolderPath = './reports'
const csvjson = require('csvjson')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * @param{Date} d
 */
var getFormattedDate = (d) => {
    return dateFormat(d, "dd-mm-yyyy")
}

/**
 * returns a string
 */
var getFileName = () => {
    var fileName = reportsFolderPath + '/' + "offileCourseCompletion" + '.csv'
    console.log("Get the file name for today " + fileName)
    return fileName
}

/** 
 * Makes a file copy 
 * @param{String} fileName
 */
var takeFileBackup = (fileName) => {
    fs.copyFileSync(fileName, reportsFolderPath + '/' + '_' + dateFormat(new Date(), "dd-mm-yyyy-hh-MM-ss") + '.csv');
}



var csvToJson = function (csvFileName) {
    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };
    var jsonObject = {}
    if (csvFileName != undefined) {
        var data = fs.readFileSync(csvFileName, { encoding: 'utf8' })
        jsonObject = csvjson.toObject(data, options)
    }
    return jsonObject
}

const csvWriter = createCsvWriter({
    path: getFileName(),
    header: [{ id: "userId", title: "userId" }, { id: "userName", title: "userName" }, { id: "courseCode", title: "courseCode" }, { id: "courseName", title: "courseName" }, { id: "isCompleted", title: "isCompleted" }, { id: "marks", title: "marks" }, { id: "completionTime", title: "completionTime" }
    ], append: false
});

var addRecordsToCSV = async (data) => {
    await csvWriter.writeRecords([data]) // returns a promise
        .then(() => {
            console.log("+++++++++++done")
        });
}

var getCurrentRecords = () => {
    var attendanceRecords = []
    var fileName = getFileName()
    if (fs.existsSync(fileName)) {
        attendanceRecords = csvToJson(fileName)
    }
    return attendanceRecords
}

var getRecordsForToday = () => {
    var attendanceRecords = []
    var fileName = getFileName()
    if (fs.existsSync(fileName)) {
        takeFileBackup(fileName)
        attendanceRecords = csvToJson(fileName)
    }
    return attendanceRecords
}

module.exports.getTodayAttendance = getRecordsForToday
module.exports.addRecordsToCSV = addRecordsToCSV
module.exports.getCurrentRecords = getCurrentRecords