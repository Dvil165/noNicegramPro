// cái file này sẽ lưu ALL route, api liên quan đến user
import { Router } from 'express'
import {
  loginController,
  logoutController,
  resendEmailVerifyController,
  forgotPasswordController,
  verifyForgotPasswordTokenController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController
} from '~/controllers/users.controlers'
import {
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator
} from '~/middlewares/users.middlewares'
import { registerController, verifyEmailController } from '~/controllers/users.controlers'
import { register } from 'module'
import { wrapAsync } from '~/utils/handlers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.request'
const userRoute = Router()

// Eg:
//quan li nhung cai route lien quan den user
// userRoute.use(
//   (req, res, next) => {
//     console.log('Time: ', Date.now())
//     //return res.status(400).send('ahihi do cho')
//     // giả sử có log huhu ở đây thì nó vẫn sẽ chạy
//     // chạy hết middleware này rồi mới ngừng
//     // return vào thì nó sẽ ngừng luôn, cho nó nghệ
//     // còn nếu có next thì nó sẽ bỏ qua
//     console.log('huhu')
//     next()
//   },
//   (req, res, next) => {
//     console.log('Time2: ', Date.now())
//     next()
//   }
// )
// // Đoạn này có nghĩa là:
// // mà kệ đi, đến đc chữ next thì nó sẽ cho chạy hàm tiếp theo
// // thử: postman và gõ thêm /api sau đó thêm /tweets
// // nếu mà ko có next() thì bên postman sẽ bị pending

// 16/10/23: login and register
/*
des: đăng nhập
path: users/login
method: POST
body: {email, password}
*/
userRoute.post('/login', loginValidator, wrapAsync(loginController))
userRoute.post('/register', registerValidator, wrapAsync(registerController))

/*
des: log out
path: user/logout
POST
header: {Authorization: 'Bearer <access_Token>'}
body: {refresh_Token: string}
*/
userRoute.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des: verify email
path: user/verify-email
method: post
body: {email_verify_token: string}
*/
userRoute.post('/verify-email', emailVerifyTokenValidator, wrapAsync(verifyEmailController))

/*
des: resend verify email
path: user/resend-verify-email
method: post
headers: {Authorization: "Bearer <access_token>"}
*/
userRoute.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
des: forgot password
path: user/forgot-password
method: post
body: {email: string}
*/
userRoute.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
des: verify forgot password 
path: user/verify-forgot-password
method: post
body: {forgot_password_token: string}
*/
userRoute.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

/*
des: reset password
path: '/reset-password'
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {forgot_password_token: string, password: string, confirm_password: string}
*/
userRoute.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)

/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
userRoute.get('/me', accessTokenValidator, wrapAsync(getMeController))

userRoute.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

userRoute.get('/:username', wrapAsync(getProfileController))

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
userRoute.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))
// follower0 id 654d7903f0a2d1282f5514dd
// follower1 id 654d79cf8f121d61080bc310
//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers

/*
    des: unfollow someone
    path: '/follow/:user_id'
    method: delete
    headers: {Authorization: Bearer <access_token>}
  g}
    */
userRoute.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)
//unfollowValidator: kiểm tra user_id truyền qua params có hợp lệ hay k?
// nơi trả dữ lịu aka controller
// trước nó thường là middleware

export default userRoute
