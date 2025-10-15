import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AppError } from "../../utils/classError";
import { decodedTokenAndFetchUser, GenerateSignature, TokenType } from "../../utils/token";
import { ChatGateway } from '../chat/chat.gateway';

// store at connectionSocket
export const connectionSocket = new Map<string, string[]>();

let io : Server | undefined = undefined


export const initializationGateway = (httpServer: HttpServer) => {
//============================ Socket.IO Class // initialize io Server ============================= 

 io = new Server(httpServer, {
        cors: {
            origin: "*"
        },
    });

//* ============================ Middle ware connection Socket.IO =============================
    io.use(async (socket: Socket, next) => {
        try {
            const { authorization } = socket.handshake?.auth;

            console.log({ authorization })

            if (!authorization) {
                throw new AppError("Provide us with token", 404);
            }
            //& split the token
            const [prefix, token] = authorization.split(" ") || [];
            if (!prefix || !token) {
                throw new AppError("Provide us with valid token/prefix", 409);
            }
            //& generate signature
            const signature = await GenerateSignature(TokenType.access, prefix)
            if (!signature) {
                throw new AppError("Invalid Signature", 400);
            }
            //& decode token and fetch user
            const { user, decoded } = await decodedTokenAndFetchUser(token, signature);

            const socketIds = connectionSocket.get(user._id.toString()) || [];
            socketIds.push(socket.id);
            connectionSocket.set(user._id.toString(), socketIds)



            socket.data.user = user;
            socket.data.decoded = decoded;

            // socket.user = user; replaced by  socket.data.user = user;
            // socket.decoded = decoded; replaced by socket.data.decoded = decoded;

            next()

        } catch (error) {
            console.log(error);
        }

    })

//============================ Chat Gateway  instance =============================
    const chatGateway: ChatGateway = new ChatGateway()
    
//^ ============================Establish connection // listen to connection Socket.IO =============================
    //localhost:3000
    io.on('connection', (socket: Socket) => {
        console.log(`client connected: ${socket.id}`);
        console.log({ socket_user: socket.data.user })
        console.log({ user_id: socket.data.user?._id?.toString()! })

        console.log({ connectionSocket })

        //^ Start ============================All events in ChatGateway =============================
        chatGateway.register(socket,getIo())
        //^ End ============================All events in ChatGateway =============================

        // function removeSocket
        function removeSocket() {    
                const remainingTabs = connectionSocket.get(socket.data.user?._id?.toString() || "")?.filter((tab) =>
                    tab !== socket.id);// return all except current socket.id

                console.log({ remainingTabs })
                if (remainingTabs?.length) {
                    connectionSocket.set(socket.data.user?._id?.toString() || "", remainingTabs)
                } else {
                    connectionSocket.delete(socket.data.user?._id?.toString() || "")
                }

                console.log(`"client disconnected: ${socket.id}`);
                getIo().emit("userDisconnected", { userId: socket.data.user?._id?.toString()! })
                console.log({ afterDisConnectionSocket: connectionSocket })           
        }

        // function removeSocket
        socket.on('offline_user', () => {
            removeSocket()
        });

    })

}

const getIo =()=>{
    if (!io){
     throw new AppError("IO is not initialized", 400)
    }
    return io
}