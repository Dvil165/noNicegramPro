// 16/10/23
import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { loginRequestBody, logoutRequestBody, registerRequestBody } from '~/models/requests/User.request'
import { ErrorWithStatus } from '~/models/Errors'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'

export const loginController = async (req: Request<ParamsDictionary, any, loginRequestBody>, res: Response) => {
  // vao req.user de lay user ra, va lay cai _id cua user do
  // dung _id de tao tokens
  const user = req.user as User
  const userID = user._id as ObjectId // nen nho lay tu db xuong, nen no se la ObjectID
  // nên là lấy xong nhớ toString để chuyển về string
  // Tao token
  const result = await userService.login(userID.toString())
  // 27/10/23 thêm toString
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESSFULLY,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, registerRequestBody>, res: Response) => {
  const result = await userService.register(req.body) // truyen thang req.body de tao user luon
  // nhưng mà làm vậy thì hàm register sẽ bị ảnh hưởng, nên là cần mod lại
  return res.status(201).json({
    message: USER_MESSAGES.REGISTER_SUCCESSFULLY,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, logoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body
  //log out se nhan rft de tim va xoa
  const result = await userService.logout(refresh_token)
  res.json(result)
}
