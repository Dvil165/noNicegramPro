import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'
import mediaService from '~/services/media.services'
import { USER_MESSAGES } from '~/constants/messages'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpSta'
import fs from 'fs'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadImage(req)
  return res.json({
    message: USER_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result: url
  })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { filename } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (error) => {
    if (error) {
      return res.status((error as any).status).send('Image not found')
    }
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadVideo(req)
  return res.json({
    message: USER_MESSAGES.UPLOAD_VIDEO_SUCCESS,
    result: url
  })
}

export const serveVideoController = async (req: Request, res: Response) => {
  const { filename } = req.params
  const range = req.headers.range
  // lay duong dan cua video
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, filename)
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const videoSize = fs.statSync(videoPath).size
  const CHUNK_SIZE = 10 ** 6 // 1MB
  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  //dung luong thuc te
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  // 206: noi dung cua ban se duoc chia cat thanh nhieu doan
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
