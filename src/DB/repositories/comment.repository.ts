import {  Model } from "mongoose";
import { Dbrepositories } from "./db.repositories";
import { Icomment } from "../model/comment.model";


export class CommentRepository extends Dbrepositories<Icomment> {
constructor(protected override model: Model<Icomment>) {
    super(model);
  }


}