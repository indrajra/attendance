class OfflineCourseCompletion {
    constructor(userId, userName, courseName, courseCode, marks) {
        this.completionTime = undefined
        this.userId = userId
        this.userName = userName
        this.courseName = courseName
        this.marks = marks
        this.courseCode = courseCode
    }

    setCourseCompletionTime(d) {
        this.completionTime = d
    }
}
module.exports = OfflineCourseCompletion 