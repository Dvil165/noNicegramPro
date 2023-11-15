import { ObjectId } from 'mongodb'

//interface dùng để định nghĩa kiểu dữ liệu
//interface không có thể dùng để tạo ra đối tượng
// Bộ mô tả kiểu dữ liệu cho RefreshToken
interface RefreshTokenType {
  _id?: ObjectId //khi tạo cũng k cần vì mongo đã tự tạo
  token: string // cái này là do mình tạo ra
  created_at?: Date // k có cũng đc, khi tạo object thì ta sẽ new Date() sau
  user_id: ObjectId
  iat: number
  exp: number
}
//class dùng để tạo ra đối tượng
//class sẽ thông qua interface
//thứ tự dùng như sau
//class này < databse < service < controller < route < app.ts < server.ts < index.ts

export default class RefreshToken {
  _id?: ObjectId //khi client gửi lên thì không cần truyền _id
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date
  constructor({ _id, token, created_at, user_id, iat, exp }: RefreshTokenType) {
    this._id = _id
    this.token = token
    this.created_at = created_at || new Date()
    this.user_id = user_id
    this.iat = new Date(iat * 1000)
    this.exp = new Date(exp * 1000)
  }
}
