import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpSta'
import { ErrorWithStatus } from '~/models/Errors'

// trong 1 error thì có 2 thứ quan trọng là message và status
// nhưng mà đây là 1 errorHandler tổng, nên có khả năng là ko có status
// sửa lại ở chỗ err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }
  // neu ma loi xuong duoc toi day, nghia la loi mac dinh
  // name, stack, message
  // ham nay lay ra cac enumerable properties dang bi false
  // set name, stack, message enumerable ve true
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  // fix xong r thi nem ra lai
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}
