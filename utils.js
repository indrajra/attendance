/**
 * Utility functions to aid in attendance marking
 */
var dateFormat = require('dateformat')
var fs = require("fs")
const reportsFolderPath = './reports'

/**
 * @param{Date} d
 */
var getFormattedDate = (d) => {
    return dateFormat(d, "dd-mm-yyyy")
}

/**
 * returns a string
 */
var getFileNameForToday = () => {
    var fileName = reportsFolderPath + '/' + getFormattedDate(Date.now()) + '.csv'
    console.log("Get the file name for today " + fileName)
    return fileName
}

/** 
 * Makes a file copy 
 * @param{String} fileName
 */
var takeFileBackup = (fileName) => {
    fs.copyFileSync(fileName, reportsFolderPath + '/' + dateFormat(new Date(), "_HHMMSS.csv"));
}

var csvToJson = function (csvFileName) {
    var jsonObject = {}
    if (csvFileName != undefined) {
        var data = fs.readFileSync(csvFileName, { encoding: 'utf8' })
        jsonObject = csvjson.toObject(data, options)
    }
    return jsonObject
}

var jsonToCsv = function (obj) {

}

var getRecordsForToday = () => {
    var attendanceRecords = {}
    var fileName = getFileNameForToday()
    if (fs.existsSync(fileName)) {
        takeFileBackup(fileName)
        attendanceRecords = csvToJson(fileName)
    }
    return attendanceRecords
}

module.exports.getTodayAttendance = getRecordsForToday