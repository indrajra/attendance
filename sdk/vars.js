const config = {
    "attendancePort":process.env.attendance_port || 7007,
    "keycloak": {
        "url": process.env.keycloak_url || "http://localhost:9080", 
        "realmName": process.env.keycloak_realmName || "PartnerRegistry",
        "clientId": "attendance",
        "clientSecret": process.env.keycloak_clientSecret || "ee8ad405-d10b-471d-82a3-363674edf6e4"
    },
    "utilServiceUrl":"http://localhost:9081"
}

module.exports = config