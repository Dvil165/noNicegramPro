import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/media.controllers'

const staticRoute = Router()
staticRoute.get('/image/:filename', serveImageController)
staticRoute.get('/video-stream/:filename', serveVideoController)

export default staticRoute
