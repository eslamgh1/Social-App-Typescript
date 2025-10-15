import { Model } from "mongoose";
import { Dbrepositories } from "./db.repositories";
import { IChat } from "../model/chat.model";


export class ChatRepository extends Dbrepositories<IChat> {
    constructor(protected override model: Model<IChat>){
        super(model)
    }
    
}
