const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const users = require('../controllers/user')

const repoName = "User"
const config = require('../config/index')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(repoName),
  logger
})

const urlPath = {
  sginup: "signup",
  login: 'login',
  profile: 'profile',
  creditPackages:'credit-package',
  password: 'password',
  course: 'course'
}

module.exports = router


//註冊
router.post('/' + urlPath.sginup, users.postSignUp)
//登入
router.post('/' + urlPath.login, users.postLogin)
//取得個人資料
router.get('/' + urlPath.profile, auth, users.getProfile)
//編輯個人資料
router.put('/' + urlPath.profile, auth, users.putProfile)
//取得使用者已購買的方案列表
router.get('/' + urlPath.creditPackages, auth, users.getCreditPackages)
//使用者更新密碼
router.put('/' + urlPath.password, auth, users.putPassword)
//TODO:取得已預約的課程列表
router.get('/' + urlPath.course, auth, users.getCourses)
//取得使用者列表(Dev)
router.get('/', users.getUserList)

