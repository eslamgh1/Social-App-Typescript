
import { Authentication } from '../../middleware/authentication';
import { fileValidation, multerCloud } from '../../middleware/multer';
import commentRouter from '../comments/comment.controller';
import { validation } from './../../middleware/validation';
import PS from "./post.service"
import * as PV from "./post.validation"
import { Router } from "express";


const postRouter: Router = Router({mergeParams:true});

postRouter.use("/:postId/comments{/:commentId/reply}",commentRouter)


postRouter.post("/",Authentication(),
 multerCloud({fileTypes: fileValidation.image} ).array("attachments",2), 
 validation(PV.createPostSchema) ,

 PS.createPost); 


 postRouter.patch("/:postId",Authentication(),
 validation(PV.likePostSchema) ,
 PS.likePost); 

 postRouter.patch("/update/:postId",
Authentication(),
 multerCloud({fileTypes: fileValidation.image} ).array("attachments",2),
 validation(PV.updatePostSchema) ,
 PS.updatePost); 

 postRouter.get("/getposts", PS.getPosts); 
 
    





export default postRouter;