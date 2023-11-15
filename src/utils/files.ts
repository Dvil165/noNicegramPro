import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import formidable from 'formidable'
import { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

// Khoi tao folder neu chua co
export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // cho phep long cac folder vao nhau, nested
      })
    }
  })
}

export const getImageName = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop()
  return nameArr.join('')
}

export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr[nameArr.length - 1]
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR),
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 3000 * 1024 * 4, //3000kb
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not supported') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((rew, rej) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return rej(err)
      }

      if (!files.image) {
        return rej(new Error('File is empty'))
      }
      return rew(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR),
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, //50mb
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not supported') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((rew, rej) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return rej(err)
      }

      if (!files.video) {
        return rej(new Error('file is empty'))
      }

      const videos = files.video as File[]
      //lay ra ten cu va duoi file (mp4, avi, mov,...)
      //dung ten moi + duoi cu va luu vao folder uploads/videos
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`)
        video.newFilename = `${video.newFilename}.${ext}`
      })
      return rew(files.video as File[])
    })
  })
}
