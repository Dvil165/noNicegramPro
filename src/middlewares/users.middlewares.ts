// 16/10/23: login and register

import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import userService from '~/services/users.services'
import { validate } from '~/utils/validations'

// Lưu tất cả mdware lien quan đến users
// eg: some1 truy cập /login => request (email, password)
//                                      nằm ở phần body
// Hàm để xử lí validator của req đó
// khi mà client truyền sẽ thông qua body, nên là mình có thể vào body để lấy
//                           có sẵn         có sẵn          //
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    // No, should be return
    return res.status(400).json({
      message: 'missing email or password'
    })
  }
  next()
}

// luc nay minh da co validator, viet theo cach khac, ko nhu tren login
// khi regis thi ta se co 1 req.body gom:
// {
//   name: string,
//   email: string,
//   pw: string,
//   confirm_pw: string,
//   date_of_birth: ISO8601,
//}
export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value, { req }) => {
          // nên truy cập db thông qua userService
          const existedEmail = await userService.emailExisted(value)
          if (existedEmail) {
            throw new Error('email ton tai roi ban oi')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          returnScore: false // manh yeu aka t f
          // returnScore: false cham diem tren thang diem 10
        }
      },
      errorMessage: `password must be at least 8 chars long, contain 1 ...`
    },
    confirmed_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
          returnScore: false // manh yeu aka t f
          // returnScore: false cham diem tren thang diem 10
        }
      },
      errorMessage: `confirmed_password must be...`,
      // Ham này để viết thêm 1 hàm kiểm tra
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('cf pw does not match pw')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          // custom chuan ISO
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
// se bi bug, tai vi cac truong thong tin nay tui no chay doc lap
// request da chay xong tui no chua kiem tra xong, nen la ko biet bug o dau
