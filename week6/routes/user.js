const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const { validateName, validateEmail, validatePassword, isNotValidString} = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const generateJWT = require('../utils/generateJWT')
const config = require('../config/index')

const repoName = "User"
const saltRounds = 10

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

router.get('/', async (req, res, next) => {
  try {
    let list = await dataSource.getRepository(repoName).find()
    sendSuccessResponse(res, 200, list)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.post('/' + urlPath.sginup, async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!validateName(name)) {
      sendFailResponse(res, 400, "欄位未填寫正確")
      return
    }
    if (!validateEmail(email)) {
      sendFailResponse(res, 400, "欄位未填寫正確")
      return
    }
    if (!validatePassword(password)) {
      sendFailResponse(res, 400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
      return
    }
    const repo = await dataSource.getRepository(repoName)
    const exitPackages = await repo.find({
      where: {
        email: email
      }
    })
    if (exitPackages.length > 0) {
      sendFailResponse(res, 409, "Email已被使用")
      return
    }
    const hashPassword = await bcrypt.hash(password, saltRounds)
    const newPackages = await repo.create({
      name: name,
      email: email,
      password: hashPassword,
      role: "USER"
    })
    const result = await repo.save(newPackages)
    let jsonData = {
      "user": {
        "id": result.id,
        "name": result.name
      }
    }
    sendSuccessResponse(res, 201, jsonData)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.post('/' + urlPath.login, async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!validateEmail(email)) {
      sendFailResponse(res, 400, "欄位未填寫正確")
      return
    }
    if (!validatePassword(password)) {
      sendFailResponse(res, 400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
      return
    }
    const repo = await dataSource.getRepository(repoName)
    const existAccount = await repo.findOne({
      select: ['id', 'name', 'password'],
      where: {
        email: email
      }
    })
    if (!existAccount) {
      sendFailResponse(res, 400, "使用者不存在或密碼輸入錯誤")
    }
    logger.info(`使用者資料: ${JSON.stringify(existAccount)}`)
    const isMatch = await bcrypt.compare(password, existAccount.password)
    if (!isMatch) {
      sendFailResponse(res, 400, "使用者不存在或密碼輸入錯誤")
    }
    const token = await generateJWT(
      { id: existAccount.id },
      config.get('secret.jwtSecret'),
      { expiresIn: `${config.get('secret.jwtExpiresDay')}` }
    )
    const jsonString = {
      token: token,
      user: {
        name: existAccount.name
      }
    }
    sendSuccessResponse(res, 201, jsonString)
  } catch (error) {
    logger.error('登入錯誤:', error)
    next(error)
  }

})

router.get('/' + urlPath.profile, auth, async (req, res, next) => {
  try {
    let { id } = req.user
    const repo = await dataSource.getRepository(repoName)
    const existAccount = await repo.findOne({
      select: ['name', 'email'],
      where: {
        id: id
      }
    })
    sendSuccessResponse(res, 200, existAccount)
  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})

//更新個人資料
router.put('/' + urlPath.profile, auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { name } = req.body
    if(isNotValidString(name)) {
      sendFailResponse(res, 400, "資料錯誤")
    }
    const repo = await dataSource.getRepository(repoName)
    const existAccount = await repo.findOne({
      select: ['name'],
      where: {
        id: id
      }
    })
    if (name === existAccount.name) {
      sendFailResponse(res, 400, "使用者名稱未變更")
      return
    }
    let result = await repo.update(
      { id, name: existAccount.name },
      { name }
    )
    if (result.affected === 0) {
      sendFailResponse(res, 400, "更新使用者資料失敗")
      return
    }
    sendSuccessResponse(res, 200)
  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})
module.exports = router
