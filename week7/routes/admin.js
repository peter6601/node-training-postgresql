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

const urlPath = {
  postToCoach: '/coaches/:userId',
  postCourse: '/coaches/courses',
  putCoach:'/coaches',
  getCoachOwnCourses: '/coaches/courses',
  getCoachOwnCourseDetail: '/coaches/courses/:courseId',
  getCoachOwnDetail:'/coaches',
  getCoachOwnMonthReveune:'/coaches',
  putCourse:'/coaches/courses/:courseId'
}

//新增教練課程
router.post(urlPath.postCourse, auth, iCoach, admins.postCourse)

//變更教練權限
router.post(urlPath.postToCoach, admins.postToCoach)

//變更教練資料
router.put(urlPath.putCoach, auth, iCoach, admins.putCoach)

//取得教練自己的課程列表
router.get(urlPath.getCoachOwnCourses,auth, iCoach, admins.getCoachOwnCourses)

//取得教練自己的課程詳細資料
router.get(urlPath.getCoachOwnCourseDetail,auth, iCoach, admins.getCoachOwnCourseDetail)

//取得教練自己詳細資料
router.get(urlPath.getCoachOwnDetail,auth, iCoach, admins.getCoachOwnDetail)

//取得教練自己的月營收資料
router.get(urlPath.getCoachOwnMonthReveune,auth, iCoach, admins.getCoachOwnMonthReveune)

//變更教練課程資料
router.put(urlPath.putCourse ,auth, iCoach, admins.putCourse)

//取得所有課程(Dev)
router.get('/coaches/courses',admins.getAllCourses)

//取得教練列表(Dev)
router.get('/coaches', admins.getAllCoaches)