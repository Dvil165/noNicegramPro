import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapAsync = (func: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
  //                                            => async means currying
  //cách này dùng hàm nào cũng đc
  try {
    await func(req, res, next)
  } catch (error) {
    next(error)
  }

  // cách dưới chỉ dùng với hàm async đc thôi
  //Promise.resolve(func(req, res, next)).catch(next)
  //*lưu nhớ rằng *Promise resolve là 1 hàm trả về 1 promise
  //khi ta dùng hàm func trong promise.resolve
  //thì nó sẽ trả về 1 promise
  //nên ta có thể dùng catch để bắt lỗi nếu promise đó bị lỗi
}
