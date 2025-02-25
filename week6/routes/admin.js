const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const userRepoName = "User"
const coachRepoName = "Coach"
const courseRepoName = "Course"
const config = require('../config/index')
const iCoach = require("../middlewares/iCoach")
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository(userRepoName),
    logger
  })
module.exports = router

router.get('/coaches/courses', async (req, res, next) => {
    try {
        let list = await dataSource.getRepository(courseRepoName).find()
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

router.post('/coaches/courses', auth, iCoach, async (req, res, next) => {
   try {
    const reqData = req.body
    const {id} = req.user
    if (isUndefined(reqData.skill_id) || isNotValidString(reqData.skill_id)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.name) || isNotValidString(reqData.name)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.description) || isNotValidString(reqData.description)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.start_at) || isNotValidString(reqData.start_at)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.end_at) || isNotValidString(reqData.end_at)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.max_participants) || isNotValidInteger(reqData.max_participants)) {
        sendFailResponse(res, 400, "欄位未填寫正確7")
        return
    }

    // let userRepo = await dataSource.getRepository(userRepoName)
    // let user = await userRepo.findOne({ where: { id: reqData.user_id } });
    // if (!user) {
    //     sendFailResponse(res, 400, "使用者不存在")
    //     return
    // }
    // if (user.role != "COACH") {
    //     sendFailResponse(res, 400, "使用者尚未成為教練")
    //     return  
    // }
    let courseRepo = await dataSource.getRepository(courseRepoName)
    let course = await courseRepo.create({
			user_id: id,
			skill_id: reqData.skill_id,
			name : reqData.name,
			description : reqData.description,
			start_at : reqData.start_at,
			end_at : reqData.end_at,
			max_participants : reqData.max_participants,
			meeting_url : reqData.meeting_url,
			created_at: reqData.created_at,
			updated_at: reqData.updated_at
    })
    let saveCourse = await courseRepo.save(course)
    let jsonString = {
        "course": saveCourse
    }
    sendSuccessResponse(res, 201, jsonString)
   } catch(error) {
    logger.error(error)
    next(error)
   }

})

router.put('/coaches/courses/:courseId',auth, iCoach, async (req, res, next) => {
    try {
        const { courseId } = req.params
        const reqData = req.body
    if (isUndefined(reqData.skill_id) || isNotValidString(reqData.skill_id)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.name) || isNotValidString(reqData.name)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.description) || isNotValidString(reqData.description)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.start_at) || isNotValidString(reqData.start_at)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.end_at) || isNotValidString(reqData.end_at)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }
    if (isUndefined(reqData.max_participants) || isNotValidInteger(reqData.max_participants)) {
        sendFailResponse(res, 400, "欄位未填寫正確7")
        return
    }
    const excludeFields = ['id', 'user_id'];
    const filteredData = Object.fromEntries(
        Object.entries(reqData).filter(([key]) => !excludeFields.includes(key))
    );
    
     await dataSource
        .getRepository(courseRepoName)
        .update({ id: courseId }, filteredData);
    let result = await dataSource.getRepository(courseRepoName).findOne({where:{id: courseId}})
    
    let jsonString = {
        "course": result
    }
    sendSuccessResponse(res, 201, jsonString)
    } catch(error) {
        logger.error(error)
        next(error)
    }
})

router.get('/coaches', async (req, res, next) => {
    try {
        let list = await dataSource.getRepository(coachRepoName).find({
            select: ["id", "user_id", "experience_years", "description", "profile_image_url", "created_at"]
        })
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

router.post('/coaches/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params
        const { experience_years, description, profile_image_url } = req.body
        if (isNotValidInteger(experience_years) ||
            isUndefined(description) ||
            isNotValidString(description)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
            return
        }
        let coachRepo = await dataSource.getRepository(coachRepoName)
        let existCoaches = await coachRepo.find({ where: { user_id: userId } });
        if (existCoaches.length > 0) {
            sendFailResponse(res, 409, "使用者已經是教練")
            return
        }
        let userRepo = await dataSource.getRepository(userRepoName)
        let user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            sendFailResponse(res, 400, "使用者不存在")
            return
        }
        user.role = "COACH"
        await userRepo.save(user)
        let coach = await coachRepo.create({
            user_id: userId,
            experience_years: experience_years,
            description: description,
            profile_image_url: profile_image_url
        })
        let saveCoach = await coachRepo.save(coach)
        let jsonString = {
            "user": {
                "name": user.name,
                "role": user.role
            },
            "coach": saveCoach
        }
        sendSuccessResponse(res, 201, jsonString)
    } catch (error) {
        logger.error(error)
        next(error)
    }
})