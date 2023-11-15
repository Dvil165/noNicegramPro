import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const mediaRoutes = Router()

mediaRoutes.post('/upload-image', accessTokenValidator, verifiedUserValidator, wrapAsync(uploadImageController))
mediaRoutes.post('/upload-video', accessTokenValidator, verifiedUserValidator, wrapAsync(uploadVideoController))

export default mediaRoutes
