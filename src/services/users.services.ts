import { registerRequestBody } from '~/models/requests/User.request'
import databaseService from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
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
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXP_IN
      }
    })
  }

  private async signTokens(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
    // return thoi, thang nao xai thi tu promise.all, ai ranh dau ma lam
  }

  async register(payload: registerRequestBody) {
    // mod lại ở chỗ này là kiểu mới

    // create a new user and add to db
    // insertOne will return insertedOne (User)
    const result = await databaseService.users.insertOne(
      new User({
        ...payload, // nhớ phân ra payload để tạo user mới
        date_of_birth: new Date(payload.date_of_birth), // overload lại cái date of birth
        // do là user đã có sẵn dob, nên là cần gán lại giá trị mới, nhớ ép kiểu về lại new Date
        password: hashPassword(payload.password) // max hoa password
      })
    )
    // Sign tokens
    // lay user id truoc
    const user_id = result.insertedId.toString()

    // trả ra mảng, sau đó phân rã, rồi dùng promise.all để tiết kiệm thời gian
    // nhận lại mảng, phân rã rồi xài
    const [access_token, refresh_token] = await this.signTokens(user_id)
    // luu tokens vao database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

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
}
const userService = new UserService()
export default userService
