const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const courses = require('../controllers/course')

const UserRepoName = "User"
const config = require('../config/index')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(UserRepoName),
  logger
})

module.exports = router

//取得課程列表
router.get('/',courses.getAllCoursees)
//報名課程
router.post('/:courseId', auth, courses.postCourseBooking)
//取消課程
router.delete('/:courseId', auth, courses.deleteCourseBooking)
