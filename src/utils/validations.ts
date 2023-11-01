/**
 * Có 1 vài bug trong đoạn code mẫu này
 * Nhớ export hàm validate
 *
 * Validation chain sẽ có đầu ra là va..chain
 * nên là khi nhận vào sẽ là mảng các validationchain
 *
 * Mà mình thì đâu có dùng cái đó đâu? mình dùng checkSchema mà?
 * Nên là phải định nghĩa lại cái đoạn code này của nó
 * Kiểu của checkSchema là: RunnableValidationChains<ValidationChain>
 *
 */

import express from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpSta'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
// đoạn này nó sẽ không spam được, đè chuột - control - nhìn tên đường dẫns

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // chỗ này nó chạy vòng for là do nó dùng valiChain
    // mà shema của mình là 1...đối tượng, nên là mình có thể . luôn
    await validations.run(req)

    const errors = validationResult(req) // dùng thằng này để lấy lỗi ra
    if (errors.isEmpty()) {
      return next()
    } // đây là ko có lỗi
    const errObjects = errors.mapped()
    //
    const entityErrors = new EntityError({ errors: {} })
    // k truyền msg vì msg mình đã mặc định giá trị cho nó rồi

    // xử lí errorObject
    // đi qua từng key (lỗi)
    for (const key in errObjects) {
      // đi qua từng lỗi và lấy ra msg
      const { msg } = errObjects[key]
      // neu loi dac biet aka khong phai 422 thi next cho defaultErrorHandler xu ly
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        //                                                                   422
        return next(msg)
      }
      // nếu nó chạy xuống đây nghĩa là lỗi 422
      // con neu la 422 thi them vao entityErrors
      entityErrors.errors[key] = msg
      // đi qua từng key của eroorObject và gán key tương ứng cho entityErrors
      // cơ mà thay vì lấy hết thì mình chỉ lấy thêm thuộc tính msg nữa mà thôi
    }
    next(entityErrors) // đây là nếu có lỗi
  }
}
// Dưới này là những cmt không còn phù hợp cho đoạn code phía trên
// hàm validate lấy từ doc về:
// mặc định nó là array, sửa nó thành mapped thì đẹp hơn nhiều
