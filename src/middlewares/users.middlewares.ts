// 16/10/23: login and register

import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { capitalize, has } from 'lodash'
import HTTP_STATUS from '~/constants/httpSta'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validations'
import { verifyToken } from '~/utils/jwt'
import { JsonWebTokenError } from 'jsonwebtoken'

// Lưu tất cả mdware lien quan đến users
// eg: some1 truy cập /login => request (email, password)
//                                      nằm ở phần body
// Hàm để xử lí validator của req đó
// khi mà client truyền sẽ thông qua body, nên là mình có thể vào body để lấy
//                           có sẵn         có sẵn          //
// khi dang nhap thi ta se co 1 req.body gom: email, password
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            // nên truy cập db thông qua userService
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            // Den day nghia la da co user, login ok
            req.user = user
            // req se di qua ra la nhieu middleware khac nhau, nen la minh
            // co the them user moi do vao req luon, de sau nay xai
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
          },
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body'] // chỗ này để tăng hiệu năng cho hàm checkSchema
    // bởi nó sẽ tìm hết trong req, nhưng mà mình chỉ cần nó check trong body thôi
    // ngoài body ra req có rất nhiều phân vùng, nên mình sẽ cần tăng hiệu năng
  )
)

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
      notEmpty: {
        errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
      },

      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      }
    },
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          // nên truy cập db thông qua userService
          const existedEmail = await userService.emailExisted(value)
          if (existedEmail) {
            throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
        },
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    confirmed_password: {
      notEmpty: {
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
        },
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
      },

      // Ham này để viết thêm 1 hàm kiểm tra
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
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
        },
        errorMessage: USER_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
      }
    }
  })
)
// se bi bug, tai vi cac truong thong tin nay tui no chay doc lap
// request da chay xong tui no chua kiem tra xong, nen la ko biet bug o dau
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1]
            // nếu ko có accessToken thì ném 401
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED // 401
              })
            }
            try {
              // nếu có accessToken, thì mình phải verify nó
              const decoded_authorization = await verifyToken({ token: accessToken })
              // decoded_authorization(payload) và lưu vào req, để dùng dần
              // để ý dấu ; ở đầu để biến nó thành 1 parameter của 1 hàm khác
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                // vì mình biết chắc nó là kiểu lỗi jsonwebtokenErr nên as luôn
                // capitalize để viết hoa chữ cái đầu, của lodash
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            // đã có trim, not empty, nên mình chỉ cần verify thôi
            /*
            trong try - catch bên dưới có thể có 2 loiaj lỗi:
            JsonwebtokenError hoặc 'token is null'
            try là để chặn ko cho lỗi (nếu có) bay ra ngoài và có status 422
            ngay dòng decoded_refresh_token
            ngoài ra còn có lỗi phát sinh do quá trình verify (không có trong db hoặc đã đc sử dụng)
            dòng if (!refresh_Token) mà mình đã custom lại đẹp rồi, nên chỉ cần throw ra cho validate
            */
            try {
              //
              //
              const [decoded_refresh_token, refresh_Token] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refreshTokens.findOne({
                  token: value //ở đây cũng có thể có bug
                })
              ])
              //
              //

              // tìm coi rft này có trong database hay không
              if (!refresh_Token) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_IS_INUSED_OR_NOT_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              // throw new ErrorWithStatus({
              //   // vì mình biết chắc nó là kiểu lỗi jsonwebtokenErr nên as luôn
              //   // capitalize để viết hoa chữ cái đầu, của lodash
              //   message: capitalize((error as JsonWebTokenError).message),
              //   status: HTTP_STATUS.UNAUTHORIZED
              // })

              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu ko phải JsonWebTokenError thì nó là lỗi do mình chủ động tạo
              // nó đẹp sẵn rồi, nên chỉ cần ném ra cho validate nữa mà thôi
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
