import mongoose, {  HydratedDocument, Types } from "mongoose";



export interface IFriendRequest {

  createdBy: Types.ObjectId,
  sendTo: Types.ObjectId,
  acceptedAt?: Date,  


}

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,required: true }, 
    acceptedAt: { type: Date },


  },
  {
    timestamps: true,
    strictQuery: true,
    // toObject: { virtuals: true },
    // toJSON: { virtuals: true },

  }
);

friendRequestSchema.pre(["findOne", "find","findOneAndDelete","findOneAndUpdate"], async function (next) {
  const query = this.getQuery()
  console.log(query)
  const { paranoid, ...rest } = query
  if (paranoid === false) {
    this.setQuery({ ...rest })
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } })
  }

  next()
})


const friendRequestModel = mongoose.models.FriendRequest || mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);

export default friendRequestModel;