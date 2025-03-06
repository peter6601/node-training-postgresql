const bcrypt = require('bcrypt')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('UsersControllers')
const { validateName, validateEmail, validatePassword, isNotValidString } = require('../utils/validators')
const { sendSuccessResponse, sendFailResponse } = require('../utils/responseHandler')

const UserRepoName = "User"
const saltRounds = 10
const config = require('../config/index')
const { password } = require('../config/db')
const generateJWT = require('../utils/generateJWT')
const CreditPurchase = require('../entities/CreditPurchase')
const CreditPackages = require('../entities/CreditPackages')

const CreditPurchaseRepoName = "CreditPurchase"

module.exports = {
    postSignUp,
    postLogin,
    getProfile,
    putProfile,
    getCreditPackages,
    putPassword,
    getCourses,
    getUserList
}
//註冊
async function postSignUp(req, res, next) {
    try {
        const { name, email, password } = req.body
        if (!validateName(name)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
            return
        }
        if (!validateEmail(email)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
            return
        }
        if (!validatePassword(password)) {
            sendFailResponse(res, 400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
            return
        }
        const repo = await dataSource.getRepository(UserRepoName)
        const exitPackages = await repo.find({
            where: {
                email: email
            }
        })
        if (exitPackages.length > 0) {
            sendFailResponse(res, 409, "Email已被使用")
            return
        }
        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newPackages = await repo.create({
            name: name,
            email: email,
            password: hashPassword,
            role: "USER"
        })
        const result = await repo.save(newPackages)
        let jsonData = {
            "user": {
                "id": result.id,
                "name": result.name
            }
        }
        sendSuccessResponse(res, 201, jsonData)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

//登入
async function postLogin(req, res, next) {
    try {
        const { email, password } = req.body
        if (!validateEmail(email)) {
            sendFailResponse(res, 400, "欄位未填寫正確")
            return
        }
        if (!validatePassword(password)) {
            sendFailResponse(res, 400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
            return
        }
        const repo = await dataSource.getRepository(UserRepoName)
        const existAccount = await repo.findOne({
            select: ['id', 'name', 'password'],
            where: {
                email: email
            }
        })
        if (!existAccount) {
            sendFailResponse(res, 400, "使用者不存在或密碼輸入錯誤")
        }
        logger.info(`使用者資料: ${JSON.stringify(existAccount)}`)
        const isMatch = await bcrypt.compare(password, existAccount.password)
        if (!isMatch) {
            sendFailResponse(res, 400, "使用者不存在或密碼輸入錯誤")
        }
        const token = await generateJWT(
            { id: existAccount.id },
            config.get('secret.jwtSecret'),
            { expiresIn: `${config.get('secret.jwtExpiresDay')}` }
        )
        const jsonString = {
            token: token,
            user: {
                name: existAccount.name
            }
        }
        sendSuccessResponse(res, 201, jsonString)
    } catch (error) {
        logger.error('登入錯誤:', error)
        next(error)
    }
}

//取得個人資料
async function getProfile(req, res, next) {
    try {
        let { id } = req.user
        const repo = await dataSource.getRepository(UserRepoName)
        const existAccount = await repo.findOne({
            select: ['name', 'email'],
            where: {
                id: id
            }
        })
        sendSuccessResponse(res, 200, existAccount)
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }
}

//編輯個人資料
async function putProfile(req, res, next) {
    try {
        const { id } = req.user
        const { name } = req.body
        if (isNotValidString(name)) {
            sendFailResponse(res, 400, "資料錯誤")
        }
        const repo = await dataSource.getRepository(UserRepoName)
        const existAccount = await repo.findOne({
            select: ['name'],
            where: {
                id: id
            }
        })
        if (name === existAccount.name) {
            sendFailResponse(res, 400, "使用者名稱未變更")
            return
        }
        let result = await repo.update(
            { id, name: existAccount.name },
            { name }
        )
        if (result.affected === 0) {
            sendFailResponse(res, 400, "更新使用者資料失敗")
            return
        }
        sendSuccessResponse(res, 200)
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }
}


//取得使用者已購買的方案列表
async function getCreditPackages(req, res, next) {
    try {
        let { id } = req.user
        let creditPurchaseRepo = dataSource.getRepository(CreditPurchaseRepoName)
        let list = await creditPurchaseRepo.find(
            { 
                where: { user_id: id },
                relations: {CreditPackage: true},
                order: {purchaseAt: 'DESC'}
            }
        )
        let purchases = list.map(item => ({
            purchased_credits: item.purchased_credits,
            price_paid: item.price_paid,
            name: item.CreditPackage.name,
            purchase_at: item.purchaseAt
        }))
        sendSuccessResponse(res,200,purchases)
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error)
        next(error)
    }

}

//使用者更新密碼
async function putPassword(req, res, next) {
    const { password, new_password, confirm_new_password } = req.body
    const {id} = req.user
    if (!validatePassword(password)) {
        sendFailResponse(res, 400, "欄位未填寫正確")
        return
    }

    if (!validatePassword(new_password)) {
        sendFailResponse(res, 400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
        return
    }
    if (new_password !== confirm_new_password ) {
        sendFailResponse(res, 400, "新密碼與驗證新密碼不一致")
        return
    }
    if (new_password === password ) {
        sendFailResponse(res, 400, "新密碼不能與舊密碼相同")
        return
    }
   try {
    const userRepo = dataSource.getRepository(UserRepoName)
    const user = await userRepo.findOne({
        where: {id: id},
        select: ['password']
    })
    const match = await bcrypt.compare(password, user.password)
    if (match) {
        const hashNewPassword = await bcrypt.hash(new_password, saltRounds);
        let renewUser = await userRepo.update(
            {id: id},
            {password: hashNewPassword}
        )
        if (renewUser.affected === 0) {
            sendFailResponse(res, 400, "更新密碼失敗")
            return
        } 
        sendSuccessResponse(res,200, null )
    } else {
        sendFailResponse(res, 400, "密碼錯誤")
    }
   }catch(error) {
    logger.error(error)
    next(error)
   }
}

//TODO:取得已預約的課程列表
async function getCourses(req, res, next) {
    
}   


//取得使用者列表(Dev)
async function getUserList(req, res, next) {
    try {
        let list = await dataSource.getRepository(UserRepoName).find()
        sendSuccessResponse(res, 200, list)
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

