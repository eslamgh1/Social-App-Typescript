
import { Authentication } from '../../middleware/authentication';
import { fileValidation, multerCloud } from '../../middleware/multer';
import { validation } from './../../middleware/validation';
import CS from "./comment.service"
import * as CV from "./comment.validation"
import { Router } from "express";


const commentRouter: Router = Router({mergeParams:true});

commentRouter.post("/",Authentication(),
 multerCloud({fileTypes: fileValidation.image} ).array("attachments",2), 
 validation(CV.createCommentSchema) ,

 CS.createComment); 


 commentRouter.get("/",Authentication(), CS.getCommentsAndReplies);


export default commentRouter;