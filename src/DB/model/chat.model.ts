import mongoose, { Schema, Types } from "mongoose";

// The interfaces are correct
export interface IMessage {
    content: string,
    createdBy: Types.ObjectId,

    createdAt?: Date,
    updatedAt?: Date,
}

export interface IChat {
    //======One versus one chat======
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
    messages: IMessage[]; // array of objects

    //======One versus Many chat======
    group?: string,
    groupImage?: string,
    roomId?: string,

    //======Common all attributes======
    createdAt: Date,
    updatedAt: Date,

}

const messageSchema = new Schema<IMessage>({
    content: { type: mongoose.Schema.Types.String, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

}, {
    timestamps: true
})

const chatSchema = new Schema<IChat>({
   
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema], 
    group: { type: String },
    groupImage: { type: String },
    roomId: { type: String },

},{
    timestamps:true
})


// The model export is correct
const chatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default chatModel;