import { Response } from 'express';
import { OptionalCrtSignerV4 } from './../../node_modules/@aws-sdk/s3-request-presigner/node_modules/@aws-sdk/signature-v4-multi-region/dist-types/signature-v4-crt-container.d';

import { ObjectCannedACL } from './../../node_modules/@aws-sdk/client-s3/dist-types/ts3.4/models/models_0.d';
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectAclCommand, GetObjectCommand, ListObjectsV2Command, ListObjectVersionsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { storageEnum } from '../middleware/multer';
import { createReadStream } from 'fs';
import { AppError } from './classError';
import { Upload } from "@aws-sdk/lib-storage";
import { get } from 'http';
import { Command } from 'concurrently';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { file, string } from 'zod';


//&===================== S3 Client ===================//
export const s3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION! as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};
//&===================== Upload File =====================//
export const uploadFile = async ({
  storeType = storageEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path,
  ACL = "private" as ObjectCannedACL,
  file,
}: {
  storeType?: storageEnum,
  Bucket?: string;
  path: string | undefined;
  ACL?: ObjectCannedACL;
  file: Express.Multer.File;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${Date.now()}_${file.originalname}`,
    Body: storeType === storageEnum.cloud ? file.buffer : createReadStream(file.path),
    ContentType: file.mimetype,
  });

  await s3Client().send(command);
  if (!command.input.Key) {
    throw new AppError("File upload failed")
  }
  return command.input.Key;
}
//&===================== Upload Large File =====================//
export const uploadLargeFile = async (
  {
    storeType = storageEnum.cloud,
    Bucket = process.env.AWS_BUCKET_NAME!,
    path = "general",
    ACL = "private" as ObjectCannedACL,
    file,
  }: {
    storeType?: storageEnum,
    Bucket?: string;
    path: string | undefined;
    ACL?: ObjectCannedACL;
    file: Express.Multer.File;
  }
): Promise<string> => {
  const upload = new Upload({
    client: s3Client(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${Date.now()}_${file.originalname}`,
      Body: storeType === storageEnum.cloud ? file.buffer : createReadStream(file.path),
      ContentType: file.mimetype,
    },
  });

  upload.on("httpUploadProgress", (progress) => {
  });

  const { Key } = await upload.done();
  if (!Key) {
    throw new AppError("File upload failed", 500)
  }
  return Key;
}
//&===================== Upload Multiple Files =====================//
export const uploadFiles = async ({
  storeType = storageEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  files,
  useLarge = false,
}: {
  storeType?: storageEnum,
  Bucket?: string,
  path: string | undefined,
  ACL?: ObjectCannedACL,
  files: Express.Multer.File[],
  useLarge?: boolean,
}) => {

  let urls: string[] = []
  if (useLarge == true) {
    urls = await Promise.all(files.map(file => uploadLargeFile({ storeType, Bucket, path, ACL, file })))
  } else {
    urls = await Promise.all(files.map(file => uploadFile({ storeType, Bucket, path, ACL, file })))
  }
  return urls;
}
//&===================== Upload pre signed URL =====================//
// export const createUploadFilePresignedUrl = async ({
//   Bucket = process.env.AWS_BUCKET_NAME!,
//   path = "general",
//   OriginalName,
//   ContentType,
//   expiresIn = 60 * 60
// }: {
//   path?: string,
//   Bucket?: string
//   OriginalName: string,
//   ContentType: string,
//   expiresIn?: number,

// }) => {
//   const command = new PutObjectCommand({
//     Bucket,
//     Key: `${process.env.APPLICATION_NAME}/${path}/${Date.now()}_${OriginalName}`,
//     ContentType,
//   });

//   const url = await getSignedUrl(s3Client(), command, { expiresIn });
//   return url // Add this line here
// }

export const createUploadFilePresignedUrl = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  OriginalName,
  ContentType,
  expiresIn = 60 * 60
}: {
  path?: string;
  Bucket?: string;
  OriginalName: string;
  ContentType: string;
  expiresIn?: number;
}): Promise<{ url: string; Key: string }> => {

  const Key = `${process.env.APPLICATION_NAME}/${path}/${Date.now()}_${OriginalName}`;
  
  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType,
  });
  
  const url = await getSignedUrl(s3Client(), command, { expiresIn });

  return { url, Key };
};

// //&===================== Get file /download =====================//
export const getFile = async (
  { Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
  }: {
    Bucket?: string,
    Key: string
  }
) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });
  return await s3Client().send(command);
}
//&===================== Get file /pre signed download =====================//

export const createGetFilePresignedUrl = async (
  { Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
    expiresIn = 60 * 5,
    downLoadName,
  }: {
    Bucket?: string,
    Key: string,
    expiresIn?: number
    downLoadName?: string | undefined,
  }
) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: downLoadName ? `attachment; filename="${downLoadName}"` : undefined,
  });
  const url = await getSignedUrl(s3Client(), command, { expiresIn });
  return url;
}

//&===================== DeleteFile =====================//

export const deleteFile = async (
  { Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
  }: {
    Bucket?: string,
    Key: string
  }
) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key,
  });
  return await s3Client().send(command);

}

//&===================== DeleteFiles =====================//

export const deleteFiles = async (
  { Bucket = process.env.AWS_BUCKET_NAME!,
    urls,
    Quiet = false,

  }: {
    Bucket?: string,
    urls: string[],
    Quiet?: boolean,
  }
) => {
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: urls.map(url => ({ Key: url })),
      Quiet,
    }}
  ) ;

  return await s3Client().send(command);

}

//&===================== Get list files =====================//

export const listFiles = async (
  { Bucket = process.env.AWS_BUCKET_NAME!,
    path,

  }: {
    Bucket?: string,
    path: string,

  }
) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}`}
  ) ;

  return await s3Client().send(command);

}






