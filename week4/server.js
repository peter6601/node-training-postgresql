require("dotenv").config()
const http = require("http")
const AppDataSource = require("./db")

function isUndefined(value) {
  return value === undefined
}

function isNotValidSting(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === ""
}

function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json"
  }
  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const packages = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"]
      })
      res.writeHead(200, headers)
      res.write(JSON.stringify({
        status: "success",
        data: packages
      }))
      res.end()
    } catch (error) {
      res.writeHead(500, headers)
      res.write(JSON.stringify({
        status: "error",
        message: "伺服器錯誤"
      }))
      res.end()
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body)
        if (isUndefined(data.name) || isNotValidSting(data.name) ||
          isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount) ||
          isUndefined(data.price) || isNotValidInteger(data.price)) {
          res.writeHead(400, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "欄位未填寫正確"
          }))
          res.end()
          return
        }
        const creditPackageRepo = await AppDataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
          where: {
            name: data.name
          }
        })
        if (existPackage.length > 0) {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
            status: "failed",
            message: "資料重複"
          }))
          res.end()
          return
        }
        const newPackage = await creditPackageRepo.create({
          name: data.name,
          credit_amount: data.credit_amount,
          price: data.price
        })
        const result = await creditPackageRepo.save(newPackage)
        res.writeHead(200, headers)
        res.write(JSON.stringify({
          status: "success",
          data: result
        }))
        res.end()
      } catch (error) {
        console.error(error)
        res.writeHead(500, headers)
        res.write(JSON.stringify({
          status: "error",
          message: "伺服器錯誤"
        }))
        res.end()
      }
    })
  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
    try {
      const packageId = req.url.split("/").pop()
      if (isUndefined(packageId) || isNotValidSting(packageId)) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      const result = await AppDataSource.getRepository("CreditPackage").delete(packageId)
      if (result.affected === 0) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      res.writeHead(200, headers)
      res.write(JSON.stringify({
        status: "success"
      }))
      res.end()
    } catch (error) {
      console.error(error)
      res.writeHead(500, headers)
      res.write(JSON.stringify({
        status: "error",
        message: "伺服器錯誤"
      }))
      res.end()
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers)
    res.end()
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const packages = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name", "createdAt"]
      })
      responseSuccess(res, headers, packages)
    } catch (error) {
      responseFail(res, headers, 500, "伺服器錯誤")
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body)
        if (isUndefined(data.name) || isNotValidSting(data.name)) {
          responseFail(res, headers, 400, "欄位未填寫正確")
          return
        }
        const skillPackagesRepo = await AppDataSource.getRepository("Skill")
        const exitPackages = await skillPackagesRepo.find({
          where: {
            name: data.name
          }
        })
        if (exitPackages.length > 0) {
          responseFail(res, headers, 409, "資料重複")
          return
        }
        const newPackages = await skillPackagesRepo.create({
          name: data.name
        })
        const result = await skillPackagesRepo.save(newPackages)
        responseSuccess(res, headers, result)
      } catch (error) {
        responseFail(res, headers, 500, "伺服器錯誤")
      }
    })
  } else if (req.url.startsWith("/api/coaches/skill/") && req.method === "DELETE") {
    try {
      let packageID = req.url.split("/").pop()
      if (isUndefined(packageID) || isNotValidSting(packageID)) {
        responseFail(res, headers, 400, "ID錯誤")
        return 
      }
      let result = await AppDataSource.getRepository("Skill").delete(packageID)
      if (result.affected === 0) {
        responseFail(res, headers, 400, "ID錯誤")
        return
      }
      responseSuccess(res, headers)

    } catch (error) {
        responseFail(res, headers, 500, "伺服器錯誤")
    }
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      status: "failed",
      message: "無此網站路由"
    }))
    res.end()
  }
}

const server = http.createServer(requestListener)

async function startServer() {
  await AppDataSource.initialize()
  console.log("資料庫連接成功")
  server.listen(process.env.PORT)
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`)
  return server;
}

function responseSuccess(res, headers, data) {
  res.writeHead(200, headers)
  let stringJson = {
    status: "success",
  }
  if (!isUndefined(data)) {
    stringJson.data = data
  }
  res.write(JSON.stringify(stringJson))
  res.end()
}

function responseFail(res, headers, code, message) {
  res.writeHead(code, headers)
  res.write(JSON.stringify({
    status: code === 500 ? "error" : "fail",
    message: message
  }))
  res.end()
}
module.exports = startServer();
