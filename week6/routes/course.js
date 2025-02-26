const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const { isUndefined, isNotValidString } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')

const CourseRepoName = "Course"
const CreditPurchaseRepoName = "CreditPurchase"
const CourseBookingRepoName = "CourseBooking"
const UserRepoName = "User"

const config = require('../config/index')
const { IsNull } = require('typeorm')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository(UserRepoName),
  logger
})

module.exports = router

//取得課程列表
router.get('/', async (req, res, next) => {
  try {
    const courses = await dataSource.getRepository(CourseRepoName).find({
        select: {
          id: true,
          description: true,
          start_at: true,
          end_at: true,
          max_participants: true,
          User: {
            name: true
          },
          Skill: {
            name: true
          }
        },
        relations: {
          User: true,
          Skill: true
        }
      })
      let courseList = courses.map(course => {
        return  {
            id: course.id,
            name: course.name,
            description: course.description,
            start_at: course.start_at,
            end_at: course.end_at,
            max_participants: course.max_participants,
            coach_name: course.User.name,
            skill_name: course.Skill.name
          }
      })
    sendSuccessResponse(res, 200, courseList)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})


//報名課程
router.post('/:courseId', auth, async (req, res, next) => {
  try {
    const { courseId } = req.params
    const { id } = req.user
    if (isUndefined(courseId) || isNotValidString(courseId)) {
      sendFailResponse(res, 400, '欄位未填寫正確')
      return
    }
    const course = await dataSource.getRepository(CourseRepoName).findOne({
      where: { id: courseId }
    })
    if (!course) {
      sendFailResponse(res, 400, 'ID錯誤')
      return
    }
    let creditPurchaseRepo =  dataSource.getRepository(CreditPurchaseRepoName)
    let courseBookingRepo =  dataSource.getRepository(CourseBookingRepoName)

    let existCourse = await courseBookingRepo.findOne({ 
        where: { user_id: id, course_id: courseId }})
    if (existCourse) {
        sendFailResponse(res, 400, '已經報名過此課程')
        return
    }

    let userCredit = await creditPurchaseRepo.sum('purchased_credits', {
        user_id: id
    })
    let userUsedCredit = await courseBookingRepo.count({
        where: { user_id: id, cancelledAt: IsNull() }
    })
    if (userCredit <= userUsedCredit) {
        sendFailResponse(res, 400, '已無可使用堂數')
        return
    }

    let courseBookingCount =  await courseBookingRepo.count({
        where: { id: courseId, cancelledAt: IsNull() }
    })
    if (courseBookingCount >= course.max_participants) {
        sendFailResponse(res, 400, '已達最大參加人數，無法參加')
        return
    }
    const newCoursebooking =  courseBookingRepo.create(
      {
        user_id: id,
        course_id: courseId
      }
    )
    await courseBookingRepo.save(newCoursebooking)

    sendSuccessResponse(res, 201, null)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//取消課程
router.delete('/:courseId', auth, async (req, res, next) => {
  try {
    const { courseId } = req.params
    const { id } = req.user
    if (isUndefined(courseId) || isNotValidString(courseId)) {
      sendFailResponse(res, 400, '欄位未填寫正確')
      return
    }
  
    let courseBookingRepo =  dataSource.getRepository(CourseBookingRepoName)

    let existCourse = await courseBookingRepo.findOne({ 
        where: { user_id: id, course_id: courseId, cancelledAt: IsNull() }})
    if (!existCourse) {
        sendFailResponse(res, 400, '課程不存在')
        return
    }

    const updateResult = await courseBookingRepo.update(
      {
        user_id: id,
        course_id: courseId,
        cancelledAt:  IsNull()
      }, {
        cancelledAt:  new Date().toISOString()

      }
    )
    if (updateResult.affected === 0) {
      sendFailResponse(res, 400, '更新失敗，可能課程已被取消或不存在');
      return;
    }

    sendSuccessResponse(res, 201, null)
  } catch (error) {
    logger.error(error)
    next(error)
  }
})
