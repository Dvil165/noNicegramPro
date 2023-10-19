// file này để định nghĩa các req đc gửi lên server
// 19/10/2023

export interface registerRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
