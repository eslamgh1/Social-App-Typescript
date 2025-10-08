import {  Model } from "mongoose";
import { Dbrepositories } from "./db.repositories";
import { IFriendRequest } from "../model/friendRequest.model";

 

export class friendRequestRepository extends Dbrepositories<IFriendRequest> {
constructor(protected override model: Model<IFriendRequest>) {
    super(model);
  }


}