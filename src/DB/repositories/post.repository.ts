import { HydratedDocument, Model } from "mongoose";

import { Dbrepositories } from "./db.repositories";

import { IPost } from "../model/post.model";


export class PostRepository extends Dbrepositories<IPost> {
constructor(protected readonly model: Model<IPost>) {
    super(model);
  }


}