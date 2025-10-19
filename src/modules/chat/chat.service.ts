import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import chatModel from "../../DB/model/chat.model";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
import { connectionSocket } from "../gateway/gateway";



export class ChatService {

    constructor() { }

    private _chatModel = new ChatRepository(chatModel)
    private _userModel = new UserRepository(userModel)

    //============================ rest Api ============================= 
    getChat = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;
        // //Add part:==> Add page and limit as dynamic
        // const { page = 1, limit = 10 } = req.query;

        // const chat = await this._chatModel.findOneQuery({
        //     participants: { $all: [userId, req.user?._id] },
        //     group: { $exists: false }
        // }).populate("participants")

        const chat = await this._chatModel.findOne({
            participants: { $all: [userId, req.user?._id] },
            group: { $exists: false }
        },
            {
                messages: {
                    $slice: [-5,5]
                }
            }, {
                populate: [{ 
                
                path: "participants" 
            }]
    })


    if(!chat) {
        throw new AppError("Chat not found", 404)
    }

        return res.status(200).json({ message: "susccess Get Chat", userId, chat })
    }
//========================== Socket APIS ============================
//========================== say Hi example ============================
sayHi = (data: any, socket: Socket, io: Server) => {
    console.log(data);
}

//=Start====================Socket Send Message===========================
sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, sendTo } = data
    const createdBy = socket?.data?.user?._id

    const user = await this._userModel.find({
        _id: sendTo,
        friends: { $in: [createdBy] }
    })

    if (!user) {
        throw new AppError("User not found", 404)
    }
    console.log({ user })

    const chat = await this._chatModel.findOneAndUpdate({
        participants: { $all: [createdBy, sendTo] },
        group: { $exists: false }
    }, {
        $push: {
            messages: [{
                content,
                createdBy
            }]
        }
    })


    if (!chat) {
        const newChat = await this._chatModel.create({
            participants: [createdBy, sendTo],
            createdBy,
            messages: [{
                content,
                createdBy,
            }]
        })


        if (!newChat) {
            throw new AppError("Chat not found", 404)
        }
    }

    io.to(connectionSocket.get(createdBy.toString())!).emit("successMessage", { content })

    io.to(connectionSocket.get(sendTo.toString())!).emit("newMessage", { content, from: socket.data.user })
}

    //=End====================New Message===========================
    

}
