import { getFile } from './../../utils/s3.config';
import { Router } from "express";
import US from "./user.service"

import { confirmEmailSchema, forgetPasswordSchema, freezedSchema, loginWithGmailSchema, resetPasswordSchema, signInSchema, signUpSchema, unfreezedSchema } from "./user.validation";
import { validation } from "../../middleware/validation";
import { Authentication } from "../../middleware/authentication";
import { TokenType } from "../../utils/token";
import { fileValidation, multerCloud, storageEnum } from "../../middleware/multer";
import { Authorization } from '../../middleware/authorization';
import { RoleType } from '../../DB/model/user.model';



const userRouter: Router = Router();

// userRouter.post("/signup", validation({ body: signUpSchema}), US.signUp); // works fine #1
userRouter.post("/signup", validation(signUpSchema), US.signUp); //works fine #2
userRouter.patch("/confirmemail", validation(confirmEmailSchema), US.confirmEmail);
userRouter.post("/signin", validation(signInSchema), US.signIn);
userRouter.post("/loginwithgmail", validation(loginWithGmailSchema), US.loginWithGmail);
userRouter.get("/getprofile", Authentication(), US.getProfile);
userRouter.post("/logout", Authentication(), US.logout);
userRouter.get("/refreshtoken", Authentication(TokenType.refresh), US.refreshToken);
userRouter.post("/forgetpassword", validation(forgetPasswordSchema), US.fotgetPassword);
userRouter.post("/resetPassword", validation(resetPasswordSchema), US.resetPassword);
userRouter.post("/upload", Authentication(), multerCloud({ fileTypes: fileValidation.image , storageType:storageEnum.disk}).single("file"), US.uploadImage);
userRouter.post("/uploadmany", Authentication(), multerCloud({ fileTypes: fileValidation.image , storageType:storageEnum.disk}).array("files"), US.uploadManyImages);
userRouter.post("/presignedurl", Authentication(), US.uploadPresignedUrl);
userRouter.get("/getfile/*path", US.getFileFn);
userRouter.get("/getpresignedurl/*path", US.getFileFnPreSignedUrl);
userRouter.get("/deletefile/*path", US.deleteFileFn);
userRouter.get("/deletefiles", US.deleteFilesFn);
userRouter.get("/getlistfiles", US.getListFilesFn); 
userRouter.post("/uploadprofileimage",Authentication(), US.uploadProfileImage); 
userRouter.delete("/freeze/{:userId}",Authentication(TokenType.access),validation(freezedSchema), US.freezeAccount); 
userRouter.delete("/unfreeze/:userId",Authentication(TokenType.access),validation(unfreezedSchema), US.unfreezeAccount); 
userRouter.get("/dashboard",Authentication(TokenType.access),Authorization({accessRole:[RoleType.admin , RoleType.superAdmin]}), US.dashBoard); 
userRouter.patch("/updaterole/:userId",Authentication(TokenType.access),Authorization({accessRole:[RoleType.admin , RoleType.superAdmin]}), US.updateRole); 
userRouter.post("/sendrequest/:userId",Authentication(TokenType.access),US.sendFriendRequest); 
userRouter.patch("/acceptrequest/:requestId",Authentication(TokenType.access),US.acceptRequest); 






export default userRouter;