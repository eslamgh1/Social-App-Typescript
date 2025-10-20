import { Server, Socket } from "socket.io"
import { AppError } from "../../utils/classError"
import { ChatService } from "./chat.service"


export class ChatEvents  {

    private _chatService: ChatService = new ChatService()
    
    constructor(){}

    
    sayHi = (socket: Socket , io:Server)=>{ 
        return socket.on("sayHi", (data) => {
        this._chatService.sayHi(data,socket,io)
        
        })
    }
    sendMessage = (socket: Socket , io:Server)=>{ 
        return socket.on("sendMessage", (data) => {
        this._chatService.sendMessage(data,socket,io)
        
        })
    }

    join_room = (socket: Socket , io:Server)=>{ 
        return socket.on("join_room", (data) => {
        this._chatService.join_room(data,socket,io)
    
        })
    }

        
}


