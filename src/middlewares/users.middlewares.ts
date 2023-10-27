// 16/10/23: login and register

import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { has } from 'lodash'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validations'

// Lưu tất cả mdware lien quan đến users
// eg: some1 truy cập /login => request (email, password)
//                                      nằm ở phần body
// Hàm để xử lí validator của req đó
// khi mà client truyền sẽ thông qua body, nên là mình có thể vào body để lấy
//                           có sẵn         có sẵn          //
// khi dang nhap thi ta se co 1 req.body gom: email, password
export const loginValidator = validate(
  checkSchema({
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
  })
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
