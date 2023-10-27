import HTTP_STATUS from '~/constants/httpSta'
import { USER_MESSAGES } from '~/constants/messages'

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any // nghĩa là ngoài cái msg ra muốn thêm bao nhiêu cũng đc
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorType
  constructor({ message = USER_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
