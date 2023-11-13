import { UpdateMeReqBody, registerRequestBody } from '~/models/requests/User.request'
import databaseService from './database.services'
import User from '~/models/schemas/User.schema'
import { Follower } from '~/models/schemas/Followers.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
import { verify } from 'crypto'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpSta'
config()

class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_EXP_IN
      },
      priKey: process.env.JWT_EMAIL_VERIFY_SECRET as string
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPwToken, verify },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXP_IN
      },
      priKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRET as string
    })
  }

  private async signTokens({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
    // return thoi, thang nao xai thi tu promise.all, ai ranh dau ma lam
  }

  async register(payload: registerRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // mod lại ở chỗ này là kiểu mới

    // create a new user and add to db
    // insertOne will return insertedOne (User)
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token, // nhớ phân ra payload để tạo user mới
        date_of_birth: new Date(payload.date_of_birth), // overload lại cái date of birth
        // do là user đã có sẵn dob, nên là cần gán lại giá trị mới, nhớ ép kiểu về lại new Date
        password: hashPassword(payload.password) // max hoa password
      })
    )
    // Sign tokens

    // trả ra mảng, sau đó phân rã, rồi dùng promise.all để tiết kiệm thời gian
    // nhận lại mảng, phân rã rồi xài
    const [access_token, refresh_token] = await this.signTokens(
      // truyền vào object
      {
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified
      }
    )
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
  // edited 3/11/2023
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // dung user id de tao token
    const [access_token, refresh_token] = await this.signTokens({
      user_id,
      verify
    })
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
    const [access_token, refresh_token] = await this.signTokens({
      user_id,
      verify: UserVerifyStatus.Verified
    })
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
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
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

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
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

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      // projection: chỉ lấy những cái mình muốn, set ve 0 la duoc
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    // Có thể truyền lên dOb hoặc không, nếu có thì nhớ ép kiểu về lại new Date, còn không thì thôi
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    // update user
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0
        }
      }
    )
    if (user == null) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    //nếu đã follow thì return message là đã follow
    if (isFollowed != null) {
      return {
        message: USER_MESSAGES.FOLLOWED // trong message.ts thêm FOLLOWED: 'Followed'
      }
    }
    //chưa thì thêm 1 document vào collection followers
    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )
    return {
      message: USER_MESSAGES.FOLLOW_SUCCESS //trong message.ts thêm   FOLLOW_SUCCESS: 'Follow success'
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    // check if minh da follow chua?
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!isFollowed) {
      return {
        message: USER_MESSAGES.ALREADY_UNFOLLOWED
      }
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_MESSAGES.UNFOLLOW_SUCCESS
    }
  }

  async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USER_MESSAGES.CHANGE_PASSWORD_SUCCESSFULLY
    }
  }

  async refresh2Tokens({
    user_id,
    verify,
    refresh_token
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
  }) {
    // tạo ra acc và ref token mới
    const [access_token, new_refresh_token] = await this.signTokens({ user_id, verify })
    // xóa ref token cũ
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    // Sau đó thêm cho user(dựa theo user_id ở trên) 1 cái ref token mới
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
}

const userService = new UserService()
export default userService
