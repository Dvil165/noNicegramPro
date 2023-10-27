// file này dùng để định nghĩa các req do client gửi lên
import { Request } from 'express'
declare module 'express' {
  interface Request {
    user?: User //
  }
}
