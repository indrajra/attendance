class AttendanceFormat {
    AttendanceFormat(userId, userName, orgName) {
        this.entryTime = undefined
        this.exitTime = undefined
        this.userId = userId
        this.userName = userName
        this.orgName = orgName
    }

    setExitTime(d) {
        this.exitTime = d
    }

    setEntryTime(d) {
        this.entryTime = d
    }
}