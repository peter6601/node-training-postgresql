const { isUndefined, isNotValidInteger } = require('./validators')
const responseHandler = {

     sendFailResponse(res, code, message) {
        res.status(code).json({
            status: "failed",
           message: message
           })
    },
     sendSuccessResponse(res,code, data) {
        let stringJson = {
            status: "success",
          }
        if (!isUndefined(data)) {
            stringJson.data = data
          }
        res.status(code).json(stringJson)
    }
}

module.exports = responseHandler;