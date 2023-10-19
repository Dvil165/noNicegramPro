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
// đoạn này nó sẽ không spam được, đè chuột - control - nhìn tên đường dẫns

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // chỗ này nó chạy vòng for là do nó dùng valiChain
    // mà shema của mình là 1...đối tượng, nên là
    await validations.run(req)

    const errors = validationResult(req) // dùng thằng này để lấy lỗi ra
    if (errors.isEmpty()) {
      return next()
    } // đây là ko có lỗi

    res.status(400).json({ errors: errors.mapped() }) // đây là nếu có lỗi
    // mặc định nó là array, sửa nó thành mapped thì đẹp hơn nhiều
  }
}
