import { deleteFile, getFile } from './s3.config';
import { get } from 'http';
import { EventEmitter } from "events";
import { generateOTP, sendEmail } from "../service/sendEmail";
import { emailTemplate } from "../service/emailTemplate";
import { success } from 'zod';
import { UserRepository } from '../DB/repositories/user.repository';
import userModel from '../DB/model/user.model';

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email, otp } = data;


  await sendEmail({
    to: email,
    subject: "Welcome to our app / Confirm your email",
    html: emailTemplate(otp as unknown as string, "Confirm your email"),

  })

})

eventEmitter.on("forgetPassword", async (data) => {
  const { email, otp } = data;


  await sendEmail({
    to: email,
    subject: "forget_Password",
    html: emailTemplate(otp as unknown as string, "Forget password"),

  })

})

eventEmitter.on("uploadProfileImage", async (data) => {
  const { userId, oldKey, Key, expiresIn } = data

  const _userModel = new UserRepository(userModel)


  setTimeout(async () => {
    try {
      await getFile({ Key })
      await _userModel.findOneAndUpdate({ _id: userId, }, { $unset: { tempProfileImage: "" } })
      // delete file from AWS - S3
      if (oldKey){
        await deleteFile({Key: oldKey})
      }

      console.log("success eventEmitter.on uploadProfileImage")
    } catch (error: any) {
      if (error.Code === "NoSuchKey")
        if (!oldKey) {
          await _userModel.findOneAndUpdate({ _id: userId, }, { $unset: { profileImage: "" } })
        } else {
          await _userModel.findOneAndUpdate({ _id: userId, }, { $set: { profileImage: oldKey } }, { $unset: { tempProfileImage: "" } })
        }
    }


  }, expiresIn * 1000);

})


