const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const generateJWT = require('../utils/generateJWT')
const config = require('../config/index')
const users = require('../controllers/user')

const repoName = "User"

const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(repoName),
  logger
})

const urlPath = {
  sginup: "signup",
  login: 'login',
  profile: 'profile'
}

module.exports = router


//註冊
router.post('/' + urlPath.sginup, users.postSignUp)

//登入
router.post('/' + urlPath.login, users.postLogin)

//取得個人資料
router.get('/' + urlPath.profile, auth, users.getProfile)

//更新個人資料
router.put('/' + urlPath.profile, auth, users.putProfile)

//取得使用者列屌(Dev)
router.get('/', users.getUserList)

