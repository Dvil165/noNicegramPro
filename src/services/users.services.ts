import { registerRequestBody } from '~/models/requests/User.request'
import databaseService from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import { config } from 'dotenv'
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
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    return { access_token, refresh_token }
  }

  async emailExisted(email: string) {
    // vao db tim user co email nay
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
    // :) ep kieu ve boolean: obj => true | null => false
  }
}
const userService = new UserService()
export default userService
