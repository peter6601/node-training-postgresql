const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('skill')
const {isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const repoName = "Skill"

router.get('/', async (req, res, next) => {
    try  {
        let list = await dataSource.getRepository(repoName).find({
            select: ["id", "name", "createdAt"]
        })
        console.log("skill get",list)
        sendSuccessResponse(res, list)
    } catch(error) {
        console.log("skill get error",error)
        logger.error(error)
        next(error)
    }
})


module.exports = router
