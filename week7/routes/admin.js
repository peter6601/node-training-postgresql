const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const admins = require('../controllers/admin')

const userRepoName = "User"
const config = require('../config/index')
const iCoach = require("../middlewares/iCoach")
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository(userRepoName),
    logger
  })
module.exports = router

//變更教練權限
router.post('/coaches/:userId', admins.postToCoach)

//新增教練課程
router.post('/coaches/courses', auth, iCoach, admins.postCourse)

//變更教練資料
router.put('/coaches', auth, iCoach, admins.postCourse)

//取得教練自己的課程列表
router.get('/coaches/courses',auth, iCoach, admins.getCoachOwnCourses)

//取得教練自己的課程詳細資料
router.get('/coaches/courses/:courseId',auth, iCoach, admins.getCoachOwnCourseDetail)

//取得教練自己詳細資料
router.get('/coaches',auth, iCoach, admins.getCoachOwnDetail)


//取得教練自己的月營收資料
router.get('/coaches',auth, iCoach, admins.getCoachOwnMonthReveune)


//變更教練課程資料
router.put('/coaches/courses/:courseId',auth, iCoach, admins.putCourse)

//取得所有課程(Dev)
router.get('/coaches/courses',admins.getAllCourses)

//取得教練列表(Dev)
router.get('/coaches', admins.getAllCoaches)