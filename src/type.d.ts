// file này dùng để định nghĩa các req do client gửi lên
// Định nghĩa lại các module của express theo ý mình
//
import { Request } from 'express'
import { TokenPayload } from './models/requests/User.request'
declare module 'express' {
  interface Request {
    user?: User //
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
  }
}
