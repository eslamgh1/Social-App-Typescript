

import { Server, Socket } from "socket.io"
import { ChatEvents } from "./chat.events"


export class ChatGateway {

    private _chatEvents : ChatEvents = new ChatEvents()

    constructor(){}


    register =(socket:Socket , io:Server)=>{
        this._chatEvents.sayHi(socket,io)
        // this._chatEvents.sendMessage(socket,io)
    }
}

