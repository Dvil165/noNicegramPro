// 16/10/23: login and register

import { Request, Response, NextFunction } from 'express'
import { ParamSchema, check, checkSchema } from 'express-validator'
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
import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { TokenPayload } from '~/models/requests/User.request'

const passwordSchema: ParamSchema = {
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
const confirmedPasswordSchema: ParamSchema = {
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
}
const nameSchema: ParamSchema = {
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
}
const emailSchema: ParamSchema = {
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
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      // custom chuan ISO
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
  }
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_FROM_1_TO_400
  }
}

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
  checkSchema(
    {
      name: nameSchema,
      email: emailSchema,
      password: passwordSchema,
      confirmed_password: confirmedPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)
// se bi bug, tai vi cac truong thong tin nay tui no chay doc lap
// request da chay xong tui no chua kiem tra xong, nen la ko biet bug o dau
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,

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
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
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
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
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

export const emailVerifyTokenValidator = validate(
  checkSchema({
    email_verify_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // neu ko truyen len email_verify_token thi se bi loi
          if (!value) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            // neu co truyen len, thi verify de lay decode
            const decoded_email_verify_token = await verifyToken({
              token: value,
              secretOrPublicKey: process.env.JWT_EMAIL_VERIFY_SECRET as string
            })
            // sau do luu vao req
            ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            // lay user_id tu decode de tim user so huu
            const user_id = decoded_email_verify_token.user_id
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            // neu co user thi xem thu xem user do co bi banned ko
            req.user = user
            // lưu lại user để lát qua controller dùng
            if (user.verify === UserVerifyStatus.Banned) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_IS_BANNED,
                status: HTTP_STATUS.FORBIDDEN
              })
            }
            // neu truyen evt len khong khop voi database
            //
            if (user.verify != UserVerifyStatus.Verified && user.email_verify_token !== value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            } // doan nay se khac trong video
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error
          }
          return true
        }
      }
    }
  })
)

export const forgotPasswordValidator = validate(
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
              email: value
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            // Den day nghia la da co user, login ok
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema({
    forgot_password_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // neu ko truyen len fp_token thi se bi loi
          if (!value) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            // neu co truyen len, thi verify de lay decode
            const decoded_forgot_password_token = await verifyToken({
              token: value,
              secretOrPublicKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRET as string
            })
            // sau do luu vao req
            ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
            // lay user_id tu decode de tim user so huu
            const user_id = decoded_forgot_password_token.user_id
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            // neu co user thi xem thu xem user do co bi banned ko
            // queen mat khau thi bi banned van cho lấy lại pass

            // neu truyen fpt len khong khop voi database
            //
            if (user.forgot_password_token !== value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error
          }
          return true
        }
      }
    }
  })
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirmedPassword: confirmedPasswordSchema
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USER_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN // 403
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true, //đc phép có hoặc k
        ...nameSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      date_of_birth: {
        optional: true, //đc phép có hoặc k
        ...dateOfBirthSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.BIO_MUST_BE_A_STRING ////messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
        },
        trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
        }
      },
      //giống bio
      location: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
        }
      },
      //giống location
      website: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_A_STRING ////messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },

          errorMessage: USER_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.USERNAME_MUST_BE_A_STRING ////messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USER_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50 //messages.ts thêm USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50'
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)
