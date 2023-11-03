// 16/10/23
import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  TokenPayload,
  loginRequestBody,
  logoutRequestBody,
  registerRequestBody,
  resetPasswordRequestBody,
  UpdateMeReqBody,
  getProfileReqParams
} from '~/models/requests/User.request'
import { ErrorWithStatus } from '~/models/Errors'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpSta'

export const loginController = async (req: Request<ParamsDictionary, any, loginRequestBody>, res: Response) => {
  // vao req.user de lay user ra, va lay cai _id cua user do
  // dung _id de tao tokens
  const user = req.user as User
  const userID = user._id as ObjectId // nen nho lay tu db xuong, nen no se la ObjectID

  // nên là lấy xong nhớ toString để chuyển về string
  // Tao token
  const result = await userService.login({ user_id: userID.toString(), verify: user.verify })
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

export const verifyEmailController = async (req: Request, res: Response) => {
  // Kiểm tra xem user này đã verify email chưa
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = req.user as User
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // Nếu đến đc đây nghĩa là chưa verify, chưa bị banned và khớp mã
  // tiến hành update: verify: 1, xóa email_verify_token, thêm vào update_at
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: USER_MESSAGES.EMAIL_VERIFY_SUCCESSFULLY,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // Nếu vào đc đây nghĩa là đã qua tầng accessTokenValidator
  // đã có decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  // Nếu có thì kiểm tra xem nó có bị ban không?
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_IS_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  // Nếu mà chưa bị ban thì kiểm tra tiếp xem nó đã verify email chưa?
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const result = await userService.resendEmailVerify(user_id)
  return res.json(result)
  // Đến đây là ready for a new one
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  // Tiến hành update lại forgot_password_token
  // mà muốn vậy thì phải biết nó là ai
  const { _id, verify } = req.user as User
  // Tiến hành update lại forgot_password_token
  const result = await userService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify
  })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  // Đến đc đây là ok hết r
  return res.json({
    message: USER_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESSFULLY
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, resetPasswordRequestBody>,
  res: Response
) => {
  // muon doi mat khau thi can user_id, new_password
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  // Tim kiem va cap nhat
  //                                nen de duoi dang obj vi co the user se truyen len nguoc
  const result = await userService.resetPassword({ user_id, password })
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  // Muon lay profile cua minh thi phai co user id cua minh
  // ma neu den dc day thi nghia la code da di qua dc tầng accessTokenValidator
  // va da co decoded_authorization, va trong decoded_authorization da co user_id
  const { user_id } = req.decoded_authorization as TokenPayload
  // dung user_id de tim user
  const user = await userService.getMe(user_id)
  return res.json({
    message: USER_MESSAGES.GET_ME_SUCCESSFULLY,
    result: user
  })
}

export const updateMeController = async (
  //  Can user_id,
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response
) => {
  //middleware accessTokenValidator đã chạy rồi, nên ta có thể lấy đc user_id từ decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  //user_id để biết phải cập nhật ai
  //lấy thông tin mới từ req.body
  const { body } = req

  //lấy các property mà client muốn cập nhật
  //ta sẽ viết hàm updateMe trong user.services
  //nhận vào user_id và body để cập nhật
  const result = await userService.updateMe(user_id, body)
  return res.json({
    message: USER_MESSAGES.UPDATE_ME_SUCCESSFULLY, //meesage.ts thêm  UPDATE_ME_SUCCESS: 'Update me success'
    result
  })
}

export const getProfileController = async (req: Request<getProfileReqParams>, res: Response) => {
  //tim user theo username
  const { username } = req.params
  const user = await userService.getProfile(username)
  return res.json({
    message: USER_MESSAGES.GET_PROFILE_SUCCESSFULLY,
    result: user
  })
}
