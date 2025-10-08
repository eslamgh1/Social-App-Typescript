import mongoose, { Types } from "mongoose"

export enum GenderType {
  male = "male",
  female = "female",
}

export enum RoleType {
  user = "user",
  admin = "admin",
  superAdmin ="superAdmin",
}
export enum ProviderType {
  system = "system",
  google = "google"
}


export interface IUser {
  _id: Types.ObjectId,
  fName: string,
  lName: string,
  userName?: string,
  email: string,
  image: string,
  password: string,
  age: number,
  phone?: string,
  adress?: string,
  profileImage?:string,  // store the key
  tempProfileImage?:string,
  otp?: string,
  confirmed?: boolean; // Add confirmed field
  provider: ProviderType,

  gender: GenderType,
  role?: RoleType,

  changeCredentials?: Date,
  deletedAt?:Date,
  deletedBy?:Types.ObjectId,
  restoredAt?:Date,
  restoredBy?:Types.ObjectId,
  friends?: Types.ObjectId[],

  createdAt: Date,
  updatedAt: Date




}


const userSchema = new mongoose.Schema<IUser>({
  fName: { type: String, required: true, minLength: 1, maxLength: 30, trim: true },
  lName: { type: String, required: true, minLength: 1, maxLength: 30, trim: true },

  email: { type: String, required: true, unique: true },
  provider: { type: String, enum: ProviderType, required: true, default: ProviderType.system },
  // this return to usserSchema
  password: {
    // this return to usserSchema
    type: String, trim: true, required: function () {
      return this.provider === ProviderType.google ? false : true
    },
  },

  age: { type: Number, min: 15, max: 80, required: function () {
      return this.provider === ProviderType.google ? false : true
    }, },
  phone: { type: String, required: false },
  profileImage:{ type: String, required: false },
  tempProfileImage:{ type: String, required: false },
  image: { type: String, required: false },
  otp: { type: String, required: false },

  deletedAt:{ type: Date },
  deletedBy:{ type: Types.ObjectId ,ref:"User" },

  restoredAt:{ type: Date },
  restoredBy:{ type: Types.ObjectId ,ref:"User" },

  friends:{ type: Types.ObjectId ,ref:"User" },




  adress: { type: String, required: false },
  changeCredentials: { type: Date },
  gender: { type: String, enum: GenderType, required: false },
  role: { type: String, enum: RoleType, required: true, default: RoleType.user },
  confirmed: { type: Boolean }, // Add confirmed field
  
},

  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  })

userSchema.virtual("userName").set(function (value) {
  const [fName, lName] = value.split(" ");
  this.fName = fName;
  this.lName = lName;
}).get(function () {
  return this.fName + " " + this.lName;
})

// userSchema.pre("save", function (next) {
//   console.log("--------------------pre saving user-----------------:");
//   console.log("pre saving user:", this);
//   next();
//   })
// userSchema.post("save", function (next) {
//   console.log("--------------------Post saving user-----------------:");
//   console.log("Post saving user:", this);
//   })


const userModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema)

export default userModel;