const { isUndefined } = require('./validators')
const responseHandler = {

     sendFailResponse(res, code, message) {
        res.status(code).json({
            status: "failed",
           message: message
           })
    },
     sendSuccessResponse(res, data) {
        let stringJson = {
            status: "success",
          }
        if (!isUndefined(data)) {
            stringJson.data = data
          }
        res.status(200).json(stringJson)
    }
}

module.exports = responseHandler;