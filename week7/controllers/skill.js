const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('controllerSkill')
const {isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const repoName = "Skill"

module.exports = {
    getAll,
    postNew,
    deleteOne
}

async function getAll(req, res, next) {
    try  {
        let list = await dataSource.getRepository(repoName).find({
            select: ["id", "name", "createdAt"]
        })
        sendSuccessResponse(res,200, list)
    } catch(error) {
        logger.error(error)
        next(error)
    }
}

async function postNew(req, res, next) {
    try {
        const data = req.body
        if (isUndefined(data.name) || isNotValidString(data.name)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
          return
        }
        const skillPackagesRepo = await dataSource.getRepository(repoName)
        const exitPackages = await skillPackagesRepo.find({
          where: {
            name: data.name
          }
        })
        if (exitPackages.length > 0) {
            sendFailResponse(res, 409, "資料重複")
          return
        }
        const newPackages = await skillPackagesRepo.create({
          name: data.name
        })
        const result = await skillPackagesRepo.save(newPackages)
        sendSuccessResponse(res,200, result)
      } catch (error) {
        logger.error(error)
        next(error)
      }
}


async function deleteOne(req, res, next) {
    try {
        const {skillID} = req.params
        if (isUndefined(skillID) || isNotValidString(skillID)) {
            sendFailResponse(res, 400, "ID錯誤")
          return 
        }
        let result = await dataSource.getRepository(repoName).delete(skillID)
        if (result.affected === 0) {
            sendFailResponse(res, 400, "ID錯誤")
          return
        }
        sendSuccessResponse(res, 200)
      } catch (error) {
        logger.error(error)
        next(error)
      }
}