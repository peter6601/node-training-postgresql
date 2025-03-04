const express = require('express')
const router = express.Router()
const skills = require('../controllers/skill')


router.get('/', skills.getAll)

router.post('/', skills.postNew)

router.delete('/:skillID', skills.deleteOne)

module.exports = router
