// cái file này sẽ lưu ALL route, api liên quan đến user
import { Router } from 'express'
import { loginController } from '~/controllers/users.controlers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controlers'
import { register } from 'module'
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

userRoute.get('/login', loginValidator, loginController)
userRoute.post('/register', registerValidator, registerController)
// nơi trả dữ lịu aka controller
// trước nó thường là middleware

export default userRoute
