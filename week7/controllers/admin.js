const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('ControllerAdmin')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')
const userRepoName = "User"
const coachRepoName = "Coach"
const courseRepoName = "Course"
const courseBookingRepoName = "CourseBooking"
const creditPackageRepoName = "CreditPackage"
const coachLinkSkillRepoName = "CoachLinkSkill"


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
dayjs.extend(utc)
const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
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

//變更教練資料
async function putCoach(req, res, next) {
    try {
        const { id } = req.user
        const data = req.body
        let err400Message = '欄位未填寫正確'
        if (isUndefined(data.experience_years) || isNotValidInteger(data.experience_years)) {
            sendFailResponse(req, 400, err400Message)
            return
        }
        if (isUndefined(data.description) || isNotValidString(data.description)) {
            sendFailResponse(res, 400, err400Message)
            return
        }
        if (isUndefined(data.profile_image_url) || isNotValidString(data.profile_image_url)) {
            sendFailResponse(res, 400, err400Message)
            return
        }
        if (isUndefined(data.skill_ids) || !Array.isArray(data.skill_ids)) {
            sendFailResponse(res, 400, err400Message)
            return
        }
        // if (data.skill_ids.length === 0 || data.skill_ids.every(skill => isUndefined(skill) || isNotValidSting(skill))) {
        //     logger.warn(err400Message)
        //     sendFailResponse(res, 40-, err400Message)
        //     return
        //   }
        let coachRepo = dataSource.getRepository(coachRepoName)
        let coach = await coachRepo.findOne({
            where: { user_id: id },
            select: ['id','experience_years', 'description', 'profile_image_url']
        })
        let resultCoach = await coachRepo.update(
            { id: coach.id }, {
            experience_years: data.experience_years,
            description: data.description,
            profile_image_url: data.profile_image_url
        })
        if (resultCoach.affected === 0) {
            sendFailResponse(res, 400, "更新使用者資料失敗")
            return
        }
        const coachLinkSkillRepo = dataSource.getRepository(coachLinkSkillRepoName)
        let newCoachLinkSkill = data.skill_ids.map(skill => ({
            coach_id: coach.id,
            skill_id: skill
        }))
        
        await coachLinkSkillRepo.delete({coach_id: coach.id})
        let insert = await coachLinkSkillRepo.insert(newCoachLinkSkill)
        const result = await coachRepo.createQueryBuilder('coach')
        .select([
          'coach.id',
          'coach.experience_years',
          'coach.description',
          'coach.profile_image_url',
          'coachLinkSkill.skill_id'
        ])
        .leftJoin('coach.CoachLinkSkill', 'coachLinkSkill')
        .where('coach.id = :coachId', { coachId: coach.id })
        .getOne();
        let skill_ids = result.CoachLinkSkill.length > 0 ? result.CoachLinkSkill.map(skill => skill.skill_id) : result.CoachLinkSkill
        let jsonString = {
            id: result.id,
            experience_years: result.experience_years,
            description: result.description,
            profile_image_url: result.profile_image_url,
            skill_ids: skill_ids
        }

        sendSuccessResponse(res, 200, jsonString)
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
        loggeå.error(error)
        next(error)
    }
}

//取得教練自己的月營收資料
async function getCoachOwnMonthReveune(req, res, next) {
    try {
        const { id } = req.user
        const { month } = req.query
        if (isUndefined(month || Object.prototype.hasOwnProperty.call(monthMap, month))) {
            let errMessage = '欄位未填寫正確'
            logger.warn(errMessage)
            sendFailResponse(res, 400, errMessage)
            return
        }
        const courseRepo = dataSource.getRepository(courseRepoName)
        const courseIds = await courseRepo
            .createQueryBuilder()
            .select('course.id')
            .from('Course', 'course')
            .where('course.user_id = :userId', { userId: id })
            .getMany()
            .then(course => course.map(course => course.id))
        let jsonString = {
            total: {
                revenue: 0,
                participants: 0,
                course_count: 0
            }
        }
        if (courseIds.length === 0) {
            sendSuccessResponse(res, 201, jsonString)
            return
        }
        const year = new Date().getFullYear()
        const calculateStartAt = dayjs(`${year}-${month}-01`).startOf('month').toISOString()
        const calculateEndAt = dayjs(`${year}-${month}-01`).endOf('month').toISOString()
        let courseCount = await getCountby("course", courseIds, calculateStartAt, calculateEndAt)
        let participants = await getCountby("participant", courseIds, calculateStartAt, calculateEndAt)
        let creditPackageRepo = dataSource.getRepository(creditPackageRepoName)
        const totalPackage = await creditPackageRepo.createQueryBuilder()
            .select('SUM(credit_amount)', 'total_credit_amount')
            .addSelect('SUM(price)', 'total_price')
            .getRawOne()
        const perCreditPrice = totalPackage.total_price / totalPackage.total_credit_amount
        const totalRevenue = courseCount.count * perCreditPrice
        jsonString = {
            total: {
                revenue: Math.floor(totalRevenue),
                participants: parseInt(participants.count, 10),
                course_count: parseInt(courseCount.count, 10)
            }
        }
        sendSuccessResponse(res, 200, jsonString)
    } catch (error) {
        logger.error(error)
        next(error)
    }
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



async function getCountby(title, courseIds, calculateStartAt, calculateEndAt) {
    let select = title === "course" ? 'COUNT(*)' : 'COUNT(DISTINCT(user_id))'
    const courseBookingRepo = dataSource.getRepository(courseBookingRepoName)
    const count = await courseBookingRepo.createQueryBuilder()
        .select(select, 'count')
        .where('course_id IN (:...ids)', { ids: courseIds })
        .andWhere('cancelled_at IS NULL')
        .andWhere('created_at >= :startDate', { startDate: calculateStartAt })
        .andWhere('created_at <= :endDate', { endDate: calculateEndAt })
        .getRawOne()
    return count
}
