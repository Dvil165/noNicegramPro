import sharp from 'sharp'
import { getImageName, handleUploadImage, handleUploadVideo } from '~/utils/files'
import { Request } from 'express'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { Media } from '~/models/Others'
import { MediaType } from '~/constants/enums'

class MediaService {
  async uploadImage(req: Request) {
    // luu anh vao trong uploads temp
    const files = await handleUploadImage(req)
    // xu li = sharp giup toi uu hinh anh
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getImageName(file.newFilename) + '.jpg'
        const newPath = UPLOAD_IMAGE_DIR + '/' + newName
        const information = await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)

        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}`
            : `http://localhost:${process.env.PORT}/static/image/${newName}`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    // luu video vao trong uploads/videos
    const files = await handleUploadVideo(req)
    // xu li = sharp giup toi uu hinh anh
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename } = file

        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-stream/${newFilename}`
            : `http://localhost:${process.env.PORT}/static/video-stream/${newFilename}`,
          type: MediaType.Video
        }
      })
    )
    return result
  }
}

const mediaService = new MediaService()
export default mediaService
