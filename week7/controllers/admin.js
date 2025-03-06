const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('ControllerAdmin')
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
module.exports = {
    postToCoach,
    postCourse,
    getCoachOwnCourses,
    putCoach,
    putCourse,
    getCoachOwnCourseDetail,
    getCoachOwnDetail,
    getCoachOwnMonthReveune,
    putCourse,
    getAllCoaches,
    getAllCourses
}

//變更教練權限
async function postToCoach(req, res, next) {
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
}

//新增教練課程
async function postCourse(req, res, next) {
    logger.info('postCourse')
    try {
        const reqData = req.body
        const { id } = req.user
        if (isUndefined(reqData.skill_id) || isNotValidString(reqData.skill_id)) {
            sendFailResponse(res, 400, "欄位skill未填寫正確")
            return
        }
        if (isUndefined(reqData.name) || isNotValidString(reqData.name)) {
            sendFailResponse(res, 400, "欄位name未填寫正確")
            return
        }
        if (isUndefined(reqData.description) || isNotValidString(reqData.description)) {
            sendFailResponse(res, 400, "欄位des未填寫正確")
            return
        }
        if (isUndefined(reqData.start_at) || isNotValidString(reqData.start_at)) {
            sendFailResponse(res, 400, "欄位startTime未填寫正確")
            return
        }
        if (isUndefined(reqData.end_at) || isNotValidString(reqData.end_at)) {
            sendFailResponse(res, 400, "欄位endTime未填寫正確")
            return
        }
        if (isUndefined(reqData.max_participants) || isNotValidInteger(reqData.max_participants)) {
            sendFailResponse(res, 400, "欄位max未填寫正確")
            return
        }

        let courseRepo = await dataSource.getRepository(courseRepoName)
        let course = courseRepo.create({
            user_id: id,
            skill_id: reqData.skill_id,
            name: reqData.name,
            description: reqData.description,
            start_at: reqData.start_at,
            end_at: reqData.end_at,
            max_participants: reqData.max_participants,
            meeting_url: reqData.meeting_url,
            created_at: reqData.created_at,
            updated_at: reqData.updated_at
        })
        let saveCourse = await courseRepo.save(course)
        let jsonString = {
            "course": saveCourse
        }
        sendSuccessResponse(res, 201, jsonString)
    } catch (error) {
        logger.error(error)
        next(error)
    }

}

//取得教練自己的課程列表
async function getCoachOwnCourses(req, res, next) {
    const { id } = req.user
    try {
        let list = await dataSource.getRepository(courseRepoName).find(
            { where: { user_id: id } }
        )
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//TODO:變更教練資料
async function putCoach(req, res, next) {
    try {
        const { id } = req.user
        const data = req.body
        if (isUndefined(data.experience_years) || isNotValidInteger(data.experience_years)) {
            sendFailResponse(req, 400, '欄位未填寫正確')
            return
        }
        if (isUndefined(data.description) || isNotValidString(data.description)) {
            sendFailResponse(res, 400, '欄位未填寫正確')
            return
        }
        if (isUndefined(data.profile_image_url) || isNotValidString(data.profile_image_url)) {
            sendFailResponse(res, 400, '欄位未填寫正確')
            return
        }
        let coachRepo = dataSource.getRepository(coachRepoName)
        let result = await coachRepo.update(
            { user_id: id }, {
                experience_years: data.experience_years,
            description: data.description,
            profile_image_url: data.profile_image_url
        }
        )
        if (result.affected === 0) {
            sendFailResponse(res, 400, "更新使用者資料失敗")
            return
        }
        let coach = await coachRepo.findOne({
            where: { user_id: id },
            select:['experience_years', 'description', 'profile_image_url']
        })
        sendSuccessResponse(res, 200, coach)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//取得教練自己的課程詳細資料
async function getCoachOwnCourseDetail(req, res, next) {
    const { courseId } = req.params
    const { id } = req.user
    if (isNotValidString(courseId)) {
        sendFailResponse(res, 400, '欄位未填寫正確')
        return
    }
    try {
        let courese = await dataSource.getRepository(courseRepoName).findOne(
            { where: { user_id: id, id: courseId } }
        )
        sendSuccessResponse(res, 200, courese)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//取得教練自己詳細資料
async function getCoachOwnDetail(req, res, next) {
    const { id } = req.user
    try {
        let coach = await dataSource.getRepository(coachRepoName).findOne({
            select: ["id", "experience_years", "description", "profile_image_url"],
            where: { user_id: id }
        })
        sendSuccessResponse(res, 200, coach)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//TODO:取得教練自己的月營收資料
async function getCoachOwnMonthReveune(req, res, next) {
}

//變更教練課程資料
async function putCourse(req, res, next) {
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
        let result = await dataSource.getRepository(courseRepoName).findOne({ where: { id: courseId } })

        let jsonString = {
            "course": result
        }
        sendSuccessResponse(res, 200, jsonString)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//取得教練列表(Dev)
async function getAllCoaches(req, res, next) {
    try {
        let list = await dataSource.getRepository(coachRepoName).find({
            select: ["id", "user_id", "experience_years", "description", "profile_image_url", "created_at"]
        })
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//取得所有課程(Dev)
async function getAllCourses(req, res, next) {
    try {
        let list = await dataSource.getRepository(courseRepoName).find()
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

