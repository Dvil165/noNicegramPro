// file này dùng để định nghĩa các req do client gửi lên
import { Request } from 'express'
import { TokenPayload } from './models/requests/User.request'
declare module 'express' {
  interface Request {
    user?: User //
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
  }
}
