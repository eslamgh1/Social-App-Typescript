import { validation } from './validation';
import multer, { diskStorage, FileFilterCallback } from 'multer'
import { AppError } from '../utils/classError'
import { file, uuidv4 } from 'zod'
import os from 'os'
import { v4 } from 'uuid';
import { Request } from 'express';

export const fileValidation = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  video: ['video/mp4', 'video/mkv', 'video/avi'],
  audio: ['audio/mpeg', 'audio/wav'],
  file: ['application/pdf'],
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}

export enum storageEnum {
  disk = "disk",
  cloud = "cloud",
}


//& storage function
export const multerCloud = (
  { fileTypes = fileValidation.image,
    storageType = storageEnum.cloud,  
    maxSize = 5,

  }: {
    fileTypes?: string[],
    storageType?: storageEnum
    maxSize?: number
  }
) => {
  //& if (storageType === storageEnum.disk or storageType === storageEnum.cloud) 
  const storage = storageType === storageEnum.cloud ? multer.memoryStorage() : multer.diskStorage({
    destination: os.tmpdir(),
    filename(req: Request, file: Express.Multer.File, cb){
      cb(null, `${uuidv4()}_${file.originalname}`)
    }
  })

  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (fileTypes.includes(file.mimetype)) {
      (cb(null, true))
    } else return cb(new AppError('Invalid file type'));
  }
  const upload = multer({ storage , limits: { fileSize: 1024 * 1024 * maxSize }, fileFilter });
  return upload


}


//until 12mins

