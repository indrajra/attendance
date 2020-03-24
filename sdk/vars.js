const config = {
    "dev": {
        "attendancePort":process.env.util_service_port || 9081,
        "keycloak": {
            "url": process.env.keycloak_url || "http://localhost:8080", 
            "realmName": process.env.keycloak_realmName || "PartnerRegistry",
            "clientId": "attendance",
            "clientSecret": process.env.keycloak_clientSecret || "ee8ad405-d10b-471d-82a3-363674edf6e4"
        },
        "utilServiceUrl":"http://localhost:9081"
    }
}

const logger = require('./log4j')

module.exports.getAllVars = function (envName) {
    var environment = envName

    // FIXME: Dont think config based on env is needed anymore given all 
    // vars can be picked up from env-vars.
    if (envName === undefined) {
        environment = 'dev'
    }
    logger.info("Service running in mode = " + environment)
    return config[environment]
}
