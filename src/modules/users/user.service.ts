import { emailTemplate } from './../../service/emailTemplate';
import { NextFunction, Request, Response } from "express"
import { FlagType, forgetPasswordSchemaType, freezedSchemaType, loginWithGmailSchemaType, resetPasswordSchemaType, signInSchema, SignUpSchemaType } from "./user.validation";
import userModel, { IUser, ProviderType, RoleType } from "../../DB/model/user.model";
import { HydratedDocument, Model, Types } from "mongoose";
import { Dbrepositories } from "../../DB/repositories/db.repositories";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import { Compare, Hash } from "../../utils/hash";
import { generateOTP, sendEmail } from "../../service/sendEmail";
import { eventEmitter } from '../../utils/eventSendEmail';
import { GenerateToken } from '../../utils/token';
import { RevokeTokenRepository } from '../../DB/repositories/revoke.repository';
import RevokeTokenModel from '../../DB/model/revoke.model';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { createGetFilePresignedUrl, createUploadFilePresignedUrl, deleteFile, deleteFiles, getFile, listFiles, uploadFile, uploadFiles, uploadLargeFile } from '../../utils/s3.config';
import { storageEnum } from '../../middleware/multer';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import postModel from '../../DB/model/post.model';
import { PostRepository } from '../../DB/repositories/post.repository';
import friendRequestModel from '../../DB/model/friendRequest.model';
import { friendRequestRepository } from '../../DB/repositories/friendRequest.repository';

const writePipeline = promisify(pipeline);

class UserService {
  private _userModel = new UserRepository(userModel)
  private _postModel = new PostRepository(postModel)
  private _friendRequestModel = new friendRequestRepository(friendRequestModel)
  private _revokeToken = new RevokeTokenRepository(RevokeTokenModel)


  constructor() { }

  //* =====================Sign Up Service=====================//
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    let { userName, email, password, cPassword, age, adress, phone, gender, role }: SignUpSchemaType = req.body;

    //& Check if user already exists
    if (await this._userModel.findOne({ email })) {
      throw new AppError("Email already exists", 409)
    }

    //& Hash password
    const hash = await Hash(password)

    //& Hash OTP
    const otp = await generateOTP();
    const hashOTP = await Hash(String(otp))

    //& Create user
    const user = await this._userModel.createOneUser({ userName, email, password: hash, otp: hashOTP, age, adress, phone, gender, role })


    //& Send Welcome email
    eventEmitter.emit("confirmEmail", { email, otp })

    //& Send final response
    return res.status(200).json({ message: "Signup - Success", user })
  }

  //* =====================Confirm Email=====================//
  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    let { email, otp } = req.body;
    //& Get user data:
    const user = await this._userModel.findOne({ email, confirmed: { $exists: false } })

    //& check user and old confirmation
    if (!user) {
      throw new AppError("email not found or already confirmed", 404)
    }
    //& compare OTP
    if (!await Compare(otp, user?.otp!)) {
      throw new AppError("Invalid OTP", 400)
    }
    //& upadte the DB:// by ===> updateOne.({condition}, {action})
    await this._userModel.updateOne({ email: user?.email }, { confirmed: true, $unset: { otp: "" } })



    return res.status(200).json({ message: "email is confirmed  - Success" })
  }
  //* =====================Sign In Service=====================//
  signIn = async (req: Request, res: Response, next: NextFunction) => {
    let { email, password }: signInSchema = req.body;

    //& Check if user already exists
    const user = await this._userModel.findOne({ email, confirmed: true, provider: ProviderType.system });
    if (!user) {
      throw new AppError("email is not found or not confirmed", 404)
    }


    //& compare Password
    if (!await Compare(password, user?.password)) {
      throw new AppError("Password is wrong", 400)
    }

    const jwtid = (Math.floor(Math.random() * 100000) + 1).toString();
    //& create accessToken 
    const accessToken = await GenerateToken({
      payload: { id: user._id, email: user.email },
      signature: user?.role == RoleType.user ? process.env.SIGNATURE_USER_TOKEN! : process.env.SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "3w", jwtid }
    });

    //& create refreshToken 
    const refreshToken = await GenerateToken({
      payload: { id: user._id, email: user.email },
      signature: user?.role == RoleType.user ? process.env.REFRESH_SIGNATURE_USER_TOKEN! : process.env.REFRESH_SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "1y", jwtid }
    });



    return res.status(200).json({ message: "SignIn - Success", accessToken, refreshToken })
  }
  //* =====================get Profile=====================//
  getProfile = async (req: Request, res: Response, next: NextFunction) => {


    return res.status(200).json({ message: "Get Profile", user: req.user })
  }

  //* =====================logout service=====================//
  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { flag } = req.body;
    if (flag === FlagType?.all) {
      await this._userModel.updateOne({ _id: req.user?._id }, { changeCredentials: new Date() })
      return res.status(200).json({ message: "logout from all devices" })
    }

    await this._revokeToken.create({
      tokenId: req.decoded?.jti!,
      userId: req.user?._id!,
      expireAt: new Date(req.decoded?.exp! * 1000)
    })

    return res.status(200).json({ message: "logout from current device" })
  }
  //* ===================== RefreshToken =====================//
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {

    const jwtid = (Math.floor(Math.random() * 100000) + 1).toString();
    //& create accessToken 
    const accessToken = await GenerateToken({
      payload: { id: req.user?._id, email: req.user?.email },
      signature: req.user?.role == RoleType.user ? process.env.SIGNATURE_USER_TOKEN! : process.env.SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "3w", jwtid }
    });

    //& create refreshToken 
    const refreshToken = await GenerateToken({
      payload: { id: req.user?._id, email: req.user?.email },
      signature: req.user?.role == RoleType.user ? process.env.REFRESH_SIGNATURE_USER_TOKEN! : process.env.REFRESH_SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "1y", jwtid }
    });


    await this._revokeToken.create({
      tokenId: req.decoded?.jti!,
      userId: req.user?._id!,
      expireAt: new Date(req.decoded?.exp! * 1000)
    })

    return res.status(200).json({ message: "Refresh token has been generated", accessToken, refreshToken })
  }
  //* ===================== Login With Gmail =====================//
  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {

    const { idToken }: loginWithGmailSchemaType = req.body;
    //&==================== Start Using a Google API Client Library===================
    const client = new OAuth2Client();
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID!,  // Specify the CLIENT_ID of the app that accesses the backend
      });
      const payload = ticket.getPayload();
      return payload;
    }
    //&=================== End Using a Google API Client Library===================

    const { email_verified, picture, email, name } = await verify() as TokenPayload
    let user = await this._userModel.findOne({ email })


    if (!user) {
      user = await this._userModel.create({
        email: email!,
        image: picture!,
        userName: name!,
        confirmed: email_verified!,
        provider: ProviderType.google,
        // password: uuidv4()  uuidv4() is used with TS not nanoId() is not working with TS
        password: uuidv4()
      })
    }

    //&  if user is found and provider is system
    if (user?.provider === ProviderType.system) {
      throw new AppError("You have registered with email & password, please use them to login", 400)
    }


    const jwtid = (Math.floor(Math.random() * 100000) + 1).toString();
    //& create accessToken 
    const accessToken = await GenerateToken({
      payload: { id: req.user?._id, email: req.user?.email },
      signature: req.user?.role == RoleType.user ? process.env.SIGNATURE_USER_TOKEN! : process.env.SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "3w", jwtid }
    });

    //& create refreshToken 
    const refreshToken = await GenerateToken({
      payload: { id: req.user?._id, email: req.user?.email },
      signature: req.user?.role == RoleType.user ? process.env.REFRESH_SIGNATURE_USER_TOKEN! : process.env.REFRESH_SIGNATURE_ADMIN_TOKEN!,
      options: { expiresIn: "1y", jwtid }
    });

    return res.status(200).json({ message: "Account is created by gmail", accessToken, refreshToken })

  }

  //~ Start========== Change Password-- [1]Forget Password--> [2]Reset Password ============//
  //* ===================== [1] - Forget Password =====================//
  fotgetPassword = async (req: Request, res: Response, next: NextFunction) => {

    const { email }: forgetPasswordSchemaType = req.body;

    //& Check if user already exists
    const user = await this._userModel.findOne({ email, confirmed: true, provider: ProviderType.system });
    if (!user) {
      throw new AppError("email is not found or not confirmed", 404)
    }

    //& Get OTP then Hash OTP
    const otp = await generateOTP();
    const hashOTP = await Hash(String(otp))

    //& Send Welcome email
    eventEmitter.emit("forgetPassword", { email, otp })

    await this._userModel.updateOne({ email: user?.email, confirmed: true }, { otp: hashOTP });

    return res.status(200).json({ message: "Send success OTP" })

  }
  //* ===================== [2]- Reset/Change Password =====================//
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {

    const { email, otp, password, cPassword }: resetPasswordSchemaType = req.body;

    //& Check if user already exists
    const user = await this._userModel.findOne({ email, otp: { $exists: true }, provider: ProviderType.system });
    if (!user) {
      throw new AppError("email is not found or not confirmed", 404)
    }


    //& compare OTP
    if (!await Compare(otp, user?.otp!)) {
      throw new AppError("Invalid OTP", 400)
    }

    //& Hash password
    const hash = await Hash(password)

    await this._userModel.updateOne({ email: user?.email }, { password: hash, $unset: { otp: "" } });

    return res.status(200).json({ message: "Password is reset successfully" })
  }
  //~ End========== Change Password-- [1]Forget Password--> [2]Reset Password ============//

  //* ===================== Upload-Multer only one file =====================//
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    const key = await uploadLargeFile({
      file: req.file!,
      path: `user/${req.user?._id}`,
      storeType: storageEnum.disk

    })

    return res.status(200).json({ message: "The file is uploaded successfully", key })

  }
  //* ===================== Upload-Multer Many files =====================//
  uploadManyImages = async (req: Request, res: Response, next: NextFunction) => {
    const key = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}`,
      storeType: storageEnum.disk
    })

    return res.status(200).json({ message: "All files are uploaded successfully", key })
  }
  //!Start:======================== AWS Intergrations======================//
  //* ===================== upload Presigned Url  =====================//
  uploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {

    const { OriginalName, ContentType } = req.body

    const url = await createUploadFilePresignedUrl({
      path: `users/${req.user?._id}`,
      ContentType,
      OriginalName,
    })
    // console.log(url);
    return res.status(200).json({ message: "The presigned url is created successfully", url })
  }

  //* ===================== getFileFn /Download =====================//
  getFileFn = async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.params as unknown as { path: string[] };
    const { downLoadName } = req.query as unknown as { downLoadName: string };

    const Key = path.join('/');
    console.log(Key)

    const result = await getFile({
      Key,
    })
    const stream = result.Body as NodeJS.ReadableStream;
    res.setHeader('Content-Type', result?.ContentType!);
    if (downLoadName) {
      res.setHeader("content-disposition", `attachment; filename="${downLoadName || path.join("/").split("/").pop()}"`);
    }
    await writePipeline(stream, res);


    return res.status(200).json({ message: "get file", result: result })
  }
  //* ===================== get pre signed URL =====================//
  getFileFnPreSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.params as unknown as { path: string[] };
    const { downLoadName } = req.query as unknown as { downLoadName: string };

    const Key = path.join('/');
    const url = await createGetFilePresignedUrl({
      Key,
      downLoadName: downLoadName ? downLoadName : undefined
    })

    return res.status(200).json({ message: "get file", url })
  }

  //* ===================== Delete File =====================//
  deleteFileFn = async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join('/');
    const results = await deleteFile({
      Key,
    })
    return res.status(200).json({ message: "File is deleted", results })
  }
  //* ===================== Delete Files =====================//
  deleteFilesFn = async (req: Request, res: Response, next: NextFunction) => {

    const results = await deleteFiles({
      urls: [
        "SocialMediaApp/users/68d2545d8292197e753911f3/1758644713824_Screenshot 2024-10-10 230125.png",
        "SocialMediaApp/users/68d2545d8292197e753911f3/1758644713824_Screenshot 2024-10-10 230125.png"
      ],
      Quiet: false

    })

    return res.status(200).json({ message: "Files are deleted", results })
  }

  //* ===================== Get list files =====================//
  getListFilesFn = async (req: Request, res: Response, next: NextFunction) => {

    const results = await listFiles({
      path: "SocialMediaApp"
    })
    if (!results?.Contents?.length) {
      throw new AppError("No files found", 404)
    }

    const resultsOfKeys = results?.Contents?.map((item) => item.Key) // to get only the keys of the files as array of strings


    // deleteFiles by keys
    await deleteFiles({
      urls: resultsOfKeys! as unknown as string[],
      Quiet: false
    })

    return res.status(200).json({ message: "Files are deleted", results: resultsOfKeys })
  }
  //!End:======================== AWS Intergrations======================//

  //* ===================== Upload Profile Image =====================//
  uploadProfileImage = async (req: Request, res: Response, next: NextFunction) => {

    const { ContentType, OriginalName } = req.body
    const { url, Key } = await createUploadFilePresignedUrl({
      path: `users/${req.user?._id}/coverImages`,
      ContentType,
      OriginalName
    })

    const user = await this._userModel.findOneAndUpdate({
      _id: req.user?._id
    }, {
      profileImage: Key,
      tempProfileImage: req?.user?.profileImage
    }
    )

    if (!user) {
      throw new AppError("User is not found.", 404)
    }

    eventEmitter.emit("uploadProfileImage", { userId: req.user?._id, oldKey: req?.user?.profileImage, Key, expiresIn: 60 })

    return res.status(200).json({ message: "The file is uploaded successfully", url, user })

  }

  //* ===================== Freeze Account =====================//
  freezeAccount = async (req: Request, res: Response, next: NextFunction) => {

    const { userId }: freezedSchemaType = req.params as freezedSchemaType
    if (userId && req.user?.role !== RoleType.admin) {
      throw new AppError("unauthorized to do freeze this account")
    }

    const user = await this._userModel.findOneAndUpdate({ _id: userId || req.user?._id, deletedAt: { $exists: false } }, { deletedAt: new Date(), deletedBy: req.user?._id, changeCredentials: new Date() })

    if (!user) {
      throw new AppError("User not found to freeze account or already freezed", 404)
    }

    return res.status(200).json({ message: "The account is freezed successfully" })

  }

  //* ===================== UnFreeze Account =====================//
  unfreezeAccount = async (req: Request, res: Response, next: NextFunction) => {

    const { userId }: freezedSchemaType = req.params as freezedSchemaType
    if (req.user?.role !== RoleType.admin) {
      throw new AppError("unauthorized to do unfreeze this account")
    }

    const user = await this._userModel.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: { $exists: true },
        deletedBy: { $ne: userId }
      },
      {
        $unset: { deletedAt: "", deletedBy: "" },
        restoredAt: new Date(),
      })

    if (!user) {
      throw new AppError("You cannot unFreeze this accont", 404)
    }

    return res.status(200).json({ message: "The account is unfreezed successfully" })

  }
  //* ===================== Dash Board =====================//
  dashBoard = async (req: Request, res: Response, next: NextFunction) => {

    const results = await Promise.allSettled([
      this._userModel.findNamed({ filter: {} }),
      this._postModel.findNamed({ filter: {} }),
    ])


    return res.status(200).json({ message: "dashBoard is issued successfully", results })

  }

  //* ===================== Update Role ( Super Admin and Admin ) =====================//
  updateRole = async (req: Request, res: Response, next: NextFunction) => {

    const { userId } = req.params

    console.log(userId)
    const { role: newRole } = req.body

    const denyRoles: RoleType[] = [newRole, RoleType.superAdmin]

    console.log({ denyRoles })
    console.log(req.user?.role)

    if (req.user?.role == RoleType.admin) {
      denyRoles.push(RoleType.admin)
      if (newRole == RoleType.superAdmin) {
        denyRoles.push(RoleType.user)
      }
    }

    const user = await this._userModel.findOneAndUpdate(
      {
        _id: userId,
        role: { $nin: denyRoles }
      },
      { role: newRole },
      { new: true })

    console.log(req.user?.role)

    if (!user) {
      throw new AppError("User not found to update role", 404)
    }

    return res.status(200).json({ message: "Role is updated successfully", user })

  }

  //* ===================== Send Friend Request =====================//
  sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params

    const user = await this._userModel.findOne({
      _id: userId,
    })



    if (!user) {
      throw new AppError("User not found to send friend request", 404)
    }


    if (req.user?._id == userId) {
      throw new AppError("You cannot send friend request to yourself", 400)
    }


    const checkRequest = await this._friendRequestModel.findOne({
      createdBy: { $in: [req.user?._id, userId] },
      sendTo: { $in: [req.user?._id, userId] },
    })


    if (checkRequest) {
      throw new AppError("You already sent a friend request to this user", 400)
    }



    const friendRequest = await this._friendRequestModel.create({
      createdBy: req.user?._id as unknown as Types.ObjectId,
      sendTo: userId as unknown as Types.ObjectId,
    })



    return res.status(200).json({ message: "The friend request is sent successfully", friendRequest })

  }

  //* ===================== Accept Friend Request =====================//
  acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params
    const checkRequest = await this._friendRequestModel.findOneAndUpdate({
      _id: requestId,
      sendTo: req.user?._id,
      acceptedAt: { $exists: false },
    }, {
      acceptedAt: new Date(),
    }, {
      new: true
    })

    if (!checkRequest) {
      throw new AppError("Request not found to accept friend request", 404)
    }

    await Promise.allSettled([
      this._userModel.updateOne({ _id: checkRequest.createdBy }, { $push: { friends: checkRequest.sendTo } }),
      this._userModel.updateOne({ _id: checkRequest.sendTo }, { $push: { friends: checkRequest.createdBy } }),
    ])

    return res.status(200).json({ message: "Success -acceptRequest ", checkRequest })
  }


  //* ===================== Reject/Decline Friend Request =====================//

  cancelRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params

    const cancelledRequest = await this._friendRequestModel.findOne({
      _id: requestId,
      $or: [
        { sendTo: req.user?._id },
        { createdBy: req.user?._id },
      ],
      acceptedAt: { $exists: false },
    })

    if (!cancelledRequest) {
      throw new AppError("Request not found to cancel, or it was already accepted/rejected", 404)
    }

    await this._friendRequestModel.deleteOne({ _id: requestId })

    return res.status(200).json({
      message: "Successfully cancelled friend request",
      cancelledRequest
    })
  }


  //* ===================== unfriend Friend Request =====================//
  unfriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params
    const checkRequest = await this._friendRequestModel.findOne({
      _id: requestId,
      $or: [
        { sendTo: req.user?._id },
        { createdBy: req.user?._id },
      ],
      acceptedAt: { $exists: true }, // Only check accepted requests (i.e., established friendships)
    })
    console.log(checkRequest)

    if (!checkRequest) {
      throw new AppError("Request not found to accept friend request", 404)
    }

    await Promise.allSettled([
      this._userModel.updateOne({ _id: checkRequest.createdBy }, { $pull: { friends: checkRequest.sendTo } }),
      this._userModel.updateOne({ _id: checkRequest.sendTo }, { $pull: { friends: checkRequest.createdBy } }),
    ])

    await this._friendRequestModel.deleteOne({ _id: requestId })

    return res.status(200).json({ message: "Success -unfriendRequest ", checkRequest })
  }

  //* ===================== next() =====================//


}
export default new UserService(); 