import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpSta'

// trong 1 error thì có 2 thứ quan trọng là message và status
// nhưng mà đây là 1 errorHandler tổng, nên có khả năng là ko có status
// sửa lại ở chỗ err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('lỗi nè ' + err.message)
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
}
