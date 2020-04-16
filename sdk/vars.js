const config = {
    "attendancePort":process.env.attendance_port || 7007,
    "keycloak": {
        "url": process.env.keycloak_url || "http://localhost:8080", 
        "realmName": process.env.keycloak_realmName || "TeacherRegistry",
        "clientId": "stall4",
        "clientSecret": process.env.keycloak_clientSecret || "a2089feb-4318-4016-b753-d0e175ca6e5f"
    },
    "utilServiceUrl":"http://localhost:9081"
}

module.exports = config
