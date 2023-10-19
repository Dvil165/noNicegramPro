// 16/10/23
import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { registerRequestBody } from '~/models/requests/User.request'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'text@gmail.com' && password === '123456') {
    res.json({
      data: [
        { name: 'Duy', yob: 2003 },
        { name: 'Hung', yob: 2002 },
        { name: 'An', yob: 2001 }
      ]
    })
  } else {
    res.status(400).json({
      message: 'login failed'
    })
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, registerRequestBody>, res: Response) => {
  try {
    const result = await userService.register(req.body) // truyen thang req.body de tao user luon
    // nhưng mà làm vậy thì hàm register sẽ bị ảnh hưởng, nên là cần mod lại
    return res.status(201).json({
      message: 'Register successfully',
      result
    })
  } catch (error) {
    return res.status(400).json({
      message: 'bad request',
      error
    })
  }
}
