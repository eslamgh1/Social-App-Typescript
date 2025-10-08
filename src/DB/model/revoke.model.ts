import mongoose, { Types } from "mongoose"


export interface IRrevokeToken {
  userId: Types.ObjectId,
  tokenId: string,
  expireAt: Date,

}


const revokeTokenSchema = new mongoose.Schema<IRrevokeToken>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenId: { type: String, required: true },
  expireAt: { type: Date, required: true }
},

  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  })




const RevokeTokenModel = mongoose.models.RevokeToken || mongoose.model<IRrevokeToken>("RevokeToken", revokeTokenSchema)

export default RevokeTokenModel;