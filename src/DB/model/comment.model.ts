import mongoose, {  HydratedDocument, Types } from "mongoose";

import { string } from "zod";

export enum onModelEnum {
  post = "Post",
  comment = "Comment"
}

export interface Icomment {
  content?: string,
  attachments?: string[],
  assetFolderId?: string,


  tags: Types.ObjectId[],
  likes: Types.ObjectId[],
  
  createdBy: Types.ObjectId,
  refId: Types.ObjectId,
  onModel: onModelEnum,


  deletedAt?: Date,
  deletedBy?: Types.ObjectId,

  restoreAt?: Date,  // Made optional to match   restoreBy?: Schema.Types.ObjectId,  // Made optional to match schema
  restoreBy?: Types.ObjectId,

}

const commentSchema = new mongoose.Schema<Icomment>(
  {
    content: {
      type: String,
      minLength: 1,
      maxLength: 10000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: [String],
    assetFolderId: String, 


    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Fixed extra }
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Fixed extra }

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, ref: "onModel", required: true },
    onModel: { type: String, enum: onModelEnum, required: true },

    // commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment"},


    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added missing comma

    restoreAt: { type: Date },
    restoreBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strictQuery: true,
  }
);

commentSchema.pre(["findOne", "find","findOneAndDelete","findOneAndUpdate"], async function (next) {
  const query = this.getQuery()
  console.log(query)
  const { paranoid, ...rest } = query
  if (paranoid === false) {
    this.setQuery({ ...rest })
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } })
  }

  next()
}

)


commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "commentId",
})






const commentModel = mongoose.models.Comment || mongoose.model<Icomment>("Comment", commentSchema);

export default commentModel;