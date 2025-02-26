const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const {dataSource} = require('../db/data-source')
const logger = require('../utils/logger')('skill')
const {validateName, validateEmail, validatePassword } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const repoName = "User"
const saltRounds = 10


router.get('/', async (req, res, next) => {
    try  {
        let list = await dataSource.getRepository(repoName).find()
        sendSuccessResponse(res, 200, list)
    } catch(error) {
        logger.error(error)
        next(error)
    }
})

router.post('/signup', async (req, res, next) => {
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
          email:email,
          password: hashPassword,
          role: "USER"
        })
        const result = await repo.save(newPackages)
        let jsonData = {
            "user":{
                "id":result.id,
                "name": result.name
            }
        }
        sendSuccessResponse(res, 201,jsonData)
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

module.exports = router
