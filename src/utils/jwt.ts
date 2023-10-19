import { rejects } from 'assert'
import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()

// cong thuc ma hoa - jwt.signOp là công thức mặc định của nó
export const signToken = ({
  payload,
  priKey = process.env.JWT_SECRET as string,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  priKey?: string
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
