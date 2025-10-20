import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import chatModel from "../../DB/model/chat.model";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
import { connectionSocket } from "../gateway/gateway";
import { Types } from "mongoose";
import { deleteFile, uploadFile } from "../../utils/s3.config";
import { uuidv4 } from "zod";


export class ChatService {

    constructor() { }

    private _chatModel = new ChatRepository(chatModel)
    private _userModel = new UserRepository(userModel)

    //============================ Get chat Api ============================= 
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
    //============================ create Group chat API ============================= 
    createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
        let { group, groupImage, participants } = req.body;
        const createdBy = req.user?._id as Types.ObjectId

        const dpParticipants = participants.map((participant :string) => Types.ObjectId.createFromHexString(participant))

        // check if the user is in the participants list
        const users = await this._userModel.find(
                {_id : { 
                    $in: dpParticipants 
                },
                friends: { 
                    $in: [createdBy] 
                }}
           )

            // check if the user is in the participants list
           if (users.length !== participants.length) {
            throw new AppError("User not found", 404)
           }


            const roomId = group.replaceAll(/\s+/g, "-") + "_" + Date.now()
           
           if ( req?.file){
            groupImage = await uploadFile({
                path: `chat/${roomId}`,
                file: req.file as Express.Multer.File
            })
           }


           dpParticipants.push(createdBy)
           const chat = await this._chatModel.create({
            group,
            groupImage,
            participants:dpParticipants,
            createdBy,
            roomId,
            messages:[]
           })

           if(!chat){
            if(groupImage){
                await deleteFile({Key:groupImage})
            }
            throw new AppError("Chat not found", 404)
           }



            return res.status(200).json({ message: "susccess createGroupChat" ,chat })
    
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


//=Start====================join_room  ===========================
join_room =  async (data: any, socket: Socket, io: Server) => {
    console.log({data});
    const { roomId } = data
    
    const chat = await this._chatModel.findOne({
        roomId,
        participants:{$in:[socket.data.user._id]},
        group:{$exists:true}
    })
    console.log({chat});
    

    if(!chat){
        throw new AppError("Chat not found", 404)
    }
    socket.join(chat?.roomId!)

}

//=End====================New Message===========================
    

}
