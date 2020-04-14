class OfflineCourseCompletion {
    /**
     * 
     * @param {*} userId  user identifier(osid)
     * @param {*} userName 
     * @param {*} courseName ofline course name
     * @param {*} courseCode course code
     * @param {*} marks points earned
     * @param {*} isCompleted wheather course completed or not (true or false)
     */
    constructor(userId, userName, courseName, courseCode, marks, isCompleted) {
        this.completionTime = undefined
        this.userId = userId
        this.userName = userName
        this.courseName = courseName
        this.marks = marks
        this.courseCode = courseCode
        this.isCompleted = isCompleted
    }

    setCourseCompletionTime(d) {
        this.completionTime = d
    }
}
module.exports = OfflineCourseCompletion 