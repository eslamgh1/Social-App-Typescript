import mongoose, { Schema } from "mongoose";

export enum allowCommentEnum {
  allow = "allow",
  deny = "deny",
}

export enum availabilityEnum {
  public = "public", // Fixed spelling: "puplic" → "public"
  private = "private",
  friends = "friends",
}

export interface IPost {
  content?: string,
  attachments?: string[],
  assetFolderId?: string,

  createdBy: Schema.Types.ObjectId,

  tags: Schema.Types.ObjectId[],
  likes: Schema.Types.ObjectId[],

  allowComment: allowCommentEnum,
  availability: availabilityEnum,

  deletedAt?: Date,
  deletedBy?: Schema.Types.ObjectId,

  restoreAt?: Date,  // Made optional to match schema
  restoreBy?: Schema.Types.ObjectId,  // Made optional to match schema

  // Virtual field
  Comments?: any[],
}

const postSchema = new mongoose.Schema<IPost>(
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
    assetFolderId: String, // Removed ? (Mongoose syntax)

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }], // Fixed extra }
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }], // Fixed extra }

    allowComment: {
      type: String,
      enum: allowCommentEnum,
      default: allowCommentEnum.allow,
    }, // Added missing comma
    availability: {
      type: String,
      enum: availabilityEnum, // Fixed: was allowCommentEnum
      default: availabilityEnum.public, // Fixed: was availabilityEnum.allow
    }, // Added missing comma

    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Added missing comma

    restoreAt: { type: Date },
    restoreBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strictQuery: true,
  }
);

postSchema.pre(["findOne", "find"], function (next) {
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

postSchema.virtual("Comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
})



const postModel = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default postModel;