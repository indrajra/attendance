const vars = require('./vars').getAllVars(process.env.NODE_ENV)
const registryUrl = vars['utilServiceUrl']
const httpUtil = require('./httpUtils.js')

class RegistryService {

    constructor() {
    }

    readRecord(value, callback) {
        const options = {
            url: registryUrl + "/registry/read",
            headers: value.headers,
            body: value.body
        }
        httpUtil.post(options, function (err, res) {
            if (res) {
                callback(null, res.body)
            } else {
                callback(err)
            }
        })
    }

    searchRecord(value, callback) {
        const options = {
            url: registryUrl + "/registry/search",
            headers: value.headers,
            body: value.body
        }
        httpUtil.post(options, function (err, res) {
            if (res) {
                callback(null, res.body)
            } else {
                callback(err)
            }
        })
    }

}

module.exports = RegistryService;
