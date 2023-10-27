import express, { Request, Response, NextFunction } from 'express'
import userRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'

const PORT = 3000
const app = express()
databaseService.connect()
app.use(express.json())

// route localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/users', userRoute)
// khi ma truy cap vao localhost3000 va nhan dc hello
// nhung ma tiep tuc /api thi se vao dc userRoute
// noi luu toan bo api lien quan den user
// sau do /tweets thi se xai dc ham
// localhost:3000/users/tweets
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is currently running on PORT ${PORT}`)
})

export default userRoute
