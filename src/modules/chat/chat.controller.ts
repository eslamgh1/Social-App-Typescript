import {  Router } from "express";
import { ChatService } from "./chat.service";
import { Authentication } from "../../middleware/authentication";


const chatRouter = Router({mergeParams:true});

const CS = new ChatService();


chatRouter.get("/",Authentication(),CS.getChat)


export default chatRouter;