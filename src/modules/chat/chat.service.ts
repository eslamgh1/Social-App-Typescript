import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import chatModel from "../../DB/model/chat.model";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import { AppError } from "../../utils/classError";

export class ChatService {

    constructor() { }

    private _chatModel = new ChatRepository(chatModel)

    //============================ rest Api ============================= 


    getChat = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const chat = await this._chatModel.findOneQuery({
            participants:{$all:[userId , req.user?._id]},
            group:{$exists:false}
        }).populate("participants")

        if (!chat){
            throw new AppError("Chat not found",404)
        }

        return res.status(200).json({ message: "susccess Get Chat" , userId , chat})
    }

    //==========================Socket.IO===========================

    sayHi = (data: any, socket: Socket, io: Server) => {
        console.log(data);
    }
    sendMessage = (data: any, socket: Socket, io: Server) => {
        console.log(data);
    }
}
