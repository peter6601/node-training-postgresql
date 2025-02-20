const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const {isUndefined, isNotValidSting, isNotValidInteger } = require('../utils/validators')

router.get('/', async (req, res, next) => {
    try {
        const packages = await dataSource.getRepository("CreditPackage").find({
          select: ["id", "name", "credit_amount", "price"]
        })
        sendSuccessResponse(res, packages)
      } catch (error) {
        logger.error(error)
        next(error)    
      }
})

router.post('/', async (req, res, next) => {
    try {
        const data = JSON.parse(req.body)
        if (isUndefined(data.name) || isNotValidSting(data.name) ||
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
        sendSuccessResponse(res, result)
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

router.delete('/:creditPackageId', async (req, res, next) => {
    try {
        const {creditPackageId} = req.params
        if (isUndefined(creditPackageId) || isNotValidSting(creditPackageId)) {
            sendFailResponse(res, 400, '欄位未填寫正確')
          return
        }
        const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId)
        if (result.affected === 0) {
            sendFailResponse(res, 400, 'ID錯誤')
          return
        }
        sendSuccessResponse(res)
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

module.exports = router

function sendFailResponse(res, code, message) {
    res.status(code).json({
        status: "failed",
       message: message
       })
}

function sendSuccessResponse(res, data) {
    let stringJson = {
        status: "success",
      }
    if (!isUndefined(data)) {
        stringJson.data = data
      }
    res.status(200).json(stringJson)
}
