const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const { P } = require('pino')
const coachRepoName = "Coach"

module.exports = router

router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1
        const per = parseInt(req.query.per) > 10 ? parseInt(req.query.per) : 10
        const skip = (page - 1) * per;
        let coaches = await dataSource.getRepository(coachRepoName).find({
            relations: { User: true },
            select: ['id', 'User'],
            skip: skip,
            take: per
        })
        const formattedCoaches = coaches.map(coach => ({
            id: coach.id,
            name: coach.User.name,
        }))
        sendSuccessResponse(res, 200, formattedCoaches)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})


router.get('/:coachId', async (req, res, next) => {
    try {
        const { coachId } = req.params
        if (isUndefined(coachId) || isNotValidString(coachId)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
            return
        }
        let coach = await dataSource.getRepository(coachRepoName).findOne({
            where: { id: coachId },
            relations: { User: true }
        })
        if (!coach) {
            sendFailResponse(res, 400, "找不到該教練")
            return
        }
        let resDate = {
            user: {
                "name": coach.User.name,
                "role": coach.User.role
            },
            coach: {
                id: coach.id,
                user_id: coach.user_id,
                experience_years: coach.experience_years,
                description: coach.description,
                profile_image_url: coach.profile_image_url,
                created_at: coach.created_at,
                updated_at: coach.updated_at
            }
        }
        sendSuccessResponse(res, 200, resDate)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})