import express, { Request, Response, NextFunction } from 'express'
import userRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediaRoutes from './routes/media.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRoute from './routes/static.routes'
import exp from 'constants'
config()

const app = express()
const router = express.Router()
const PORT = process.env.PORT || 4000
initFolder()
app.use(express.json())

databaseService.connect().then(() => {
  databaseService.indexUsers()
})

// route localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/media', mediaRoutes)
app.use('/users', userRoute)
app.use('/static', staticRoute)
// khi ma truy cap vao localhost3000 va nhan dc hello
// nhung ma tiep tuc /api thi se vao dc userRoute
// noi luu toan bo api lien quan den user
// sau do /tweets thi se xai dc ham
// localhost:3000/users/tweets
app.use(defaultErrorHandler)

// listen on port 3000 should be the last line
app.listen(PORT, () => {
  console.log(`Server is currently running on PORT ${PORT}`)
})

export default userRoute
