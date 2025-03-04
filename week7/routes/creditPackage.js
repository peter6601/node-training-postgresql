
const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const creditPackages = require('../controllers/creditPackage')


const userRepoName = "User"

const config = require('../config/index')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(userRepoName),
  logger
})


module.exports = router

//取得購買方案列表
router.get('/', creditPackages.getAll)

//新增購買方案
router.post('/', creditPackages.postNew)

//刪除購買方案
router.delete('/:creditPackageId', creditPackages.deleteOne)

//使用者購買方案
router.post('/:creditPackageId', auth, creditPackages.postBuyOne)



