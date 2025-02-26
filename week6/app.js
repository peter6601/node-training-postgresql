const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')

const logger = require('./utils/logger')('App')
const creditPackageRouter = require('./routes/creditPackage')
const skillRouter = require('./routes/skill')
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
const coachRouter = require('./routes/coach')
const courseRouter = require('./routes/course')


const creditPackagePath = "/api/credit-package"
const skillPath = "/api/coaches/skill"
const userPath = "/api/users"
const adminPath = "/api/admin"
const coachPath = "/api/coaches"
const coursePath = "/api/course"

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(pinoHttp({
  logger,
  serializers: {
    req (req) {
      req.body = req.raw.body
      return req
    }
  }
}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/healthcheck', (req, res) => {
  res.status(200)
  res.send('OK')
})
app.use(creditPackagePath, creditPackageRouter)
app.use(skillPath, skillRouter)
app.use(userPath, userRouter)
app.use(adminPath, adminRouter)
app.use(coachPath, coachRouter)
app.use(coursePath, courseRouter)



// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err)
  if (err.status) {
    res.status(err.status).json({
      status: 'fail',
      message: err.message
    })
  } else {
    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
 
})

module.exports = app
