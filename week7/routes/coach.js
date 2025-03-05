const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')
const { P } = require('pino')
const coaches = require('../controllers/coach')
module.exports = router

//取得教練列表
router.get('/',coaches.getAllCoaches )

//取得教練詳細資料
router.get('/:coachId', coaches.getCoachDetail)

//取得指定教練課程列表
router.get('/:coachId/courses', coaches.getCoachCourses)