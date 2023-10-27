// file này để định nghĩa các req đc gửi lên server
// 19/10/2023

import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'

export interface registerRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface loginRequestBody {
  email: string
  password: string
}

export interface logoutRequestBody {
  refresh_token: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}
