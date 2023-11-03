import { registerRequestBody } from '~/models/requests/User.request'
import databaseService from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
config()

class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_EXP_IN
      },
      priKey: process.env.JWT_EMAIL_VERIFY_SECRET as string
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPwToken },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRET as string
    })
  }

  private async signTokens(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
    // return thoi, thang nao xai thi tu promise.all, ai ranh dau ma lam
  }

  async register(payload: registerRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    // mod lại ở chỗ này là kiểu mới

    // create a new user and add to db
    // insertOne will return insertedOne (User)
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token, // nhớ phân ra payload để tạo user mới
        date_of_birth: new Date(payload.date_of_birth), // overload lại cái date of birth
        // do là user đã có sẵn dob, nên là cần gán lại giá trị mới, nhớ ép kiểu về lại new Date
        password: hashPassword(payload.password) // max hoa password
      })
    )
    // Sign tokens

    // trả ra mảng, sau đó phân rã, rồi dùng promise.all để tiết kiệm thời gian
    // nhận lại mảng, phân rã rồi xài
    const [access_token, refresh_token] = await this.signTokens(user_id.toString())
    // luu tokens vao database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    // giả bộ gửi mail
    console.log(email_verify_token)

    return { access_token, refresh_token }
  }

  async emailExisted(email: string) {
    // vao db tim user co email nay
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
    // :) ep kieu ve boolean: obj => true | null => false
  }

  async login(user_id: string) {
    // dung user id de tao token
    const [access_token, refresh_token] = await this.signTokens(user_id)
    //return 2 cai token cho controller
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    // xoa refresh token khoi db
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USER_MESSAGES.LOGOUT_SUCCESSFULLY }
  }

  async verifyEmail(user_id: string) {
    // cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      }, // tìm user tương ứng (filter)
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            updated_at: '$$NOW' // thuộc tính của mongodb, để cho 2 cái date này khớp nhau
          }
        }
      ]
    )
    // Tạo access token và refresh token
    const [access_token, refresh_token] = await this.signTokens(user_id)
    // lưu vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    // tạo lại token
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    // update lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    // giả bộ gửi mail
    console.log(email_verify_token)
    return { message: USER_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESSFULLY }
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    // update user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    // giả bộ gửi mail  :)
    console.log(forgot_password_token)
    return { message: USER_MESSAGES.CHECK_MAIL_TO_RESET_PASSWORD }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    return { message: USER_MESSAGES.RESET_PASSWORD_SUCCESSFULLY }
  }
}
const userService = new UserService()
export default userService
