
const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')

const userRepoName = "User"
const creditPackageRepoName = "CreditPackage"
const CreditPurchaseRepoName = "CreditPurchase"

const config = require('../config/index')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(userRepoName),
  logger
})


module.exports = router

//取得購買方案列表
router.get('/', async (req, res, next) => {
  try {
    const packages = await dataSource.getRepository("CreditPackage").find({
      select: ["id", "name", "credit_amount", "price"]
    })
    sendSuccessResponse(res, 200, packages)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//新增購買方案
router.post('/', async (req, res, next) => {
  try {
    const data = req.body
    if (isUndefined(data.name) || isNotValidString(data.name) ||
      isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount) ||
      isUndefined(data.price) || isNotValidInteger(data.price)) {
      sendFailResponse(res, 400, "欄位未填寫正確")
      return
    }
    const creditPackageRepo = await dataSource.getRepository("CreditPackage")
    const existPackage = await creditPackageRepo.find({
      where: {
        name: data.name
      }
    })
    if (existPackage.length > 0) {
      sendFailResponse(res, 409, "資料重複")
      return
    }
    const newPackage = await creditPackageRepo.create({
      name: data.name,
      credit_amount: data.credit_amount,
      price: data.price
    })
    const result = await creditPackageRepo.save(newPackage)
    sendSuccessResponse(res, 200, result)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//刪除購買方案
router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
      sendFailResponse(res, 400, '欄位未填寫正確')
      return
    }
    const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId)
    if (result.affected === 0) {
      sendFailResponse(res, 400, 'ID錯誤')
      return
    }
    sendSuccessResponse(res, 200)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//使用者購買方案
router.post('/:creditPackageId', auth, async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    const { id } = req.user
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
      sendFailResponse(res, 400, '欄位未填寫正確')
      return
    }
    const creditPackage = await dataSource.getRepository(creditPackageRepoName).findOne({
      where: { id: creditPackageId }
    })
    if (!creditPackage) {
      sendFailResponse(res, 400, 'ID錯誤')
      return
    }
    let creditPurchaseRepo =  dataSource.getRepository(CreditPurchaseRepoName)
    const purchase = creditPurchaseRepo.create(
      {
        user_id: id,
        credit_package_id: creditPackage.id,
        purchased_credits: creditPackage.credit_amount,
        price_paid: creditPackage.price,
        purchaseAt: new Date().toISOString()
      }
    )
    await creditPurchaseRepo.save(purchase)

    sendSuccessResponse(res, 200, null)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})



