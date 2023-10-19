import { createHash } from 'crypto'
import { config } from 'dotenv'
config()

// doan code này có thể đc lấy từ sha256 luôn
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

// Ham ma hoa password
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
