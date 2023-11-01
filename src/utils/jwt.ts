import { rejects } from 'assert'
import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { TokenPayload } from '~/models/requests/User.request'
config()

// cong thuc ma hoa - jwt.signOp là công thức mặc định của nó
export const signToken = ({
  payload,
  priKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  priKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((rew, rej) => {
    jwt.sign(payload, priKey, options, (error, token) => {
      if (error) throw rej(error)
      rew(token as string)
    })
  })
}
// const func = ({obj} : {dinh nghia lai}) => {return ... }

// Hàm nhận vào token, secretOrPublicKey?
export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  //                giới hạn lại đầu ra của promise
  return new Promise<TokenPayload>((rew, rej) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) throw rej(error)
      rew(decoded as TokenPayload)
    })
  })
}
