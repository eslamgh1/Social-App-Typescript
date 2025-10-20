import {  Router } from "express";
import { ChatService } from "./chat.service";
import { Authentication } from "../../middleware/authentication";
import { fileValidation, multerCloud } from "../../middleware/multer";


const chatRouter = Router({mergeParams:true});

const CS = new ChatService();


chatRouter.get("/",Authentication(),CS.getChat)

chatRouter.post("/group",Authentication(), multerCloud({fileTypes: fileValidation.image} ).single("attachment"),CS.createGroupChat)


export default chatRouter;