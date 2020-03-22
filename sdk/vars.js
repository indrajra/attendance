const config = {
    "dev": {
        "attendancePort":process.env.util_service_port || 9081,
        "keycloak": {
            "url": process.env.keycloak_url || "http://localhost:8080", 
            "realmName": process.env.keycloak_realmName || "PartnerRegistry",
            "clientId": "utils",
            "clientSecret": process.env.keycloak_clientSecret || "4ee47785-6434-4e6f-85d7-51096c3de579"
        }
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
