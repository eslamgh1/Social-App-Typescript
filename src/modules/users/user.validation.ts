import { z } from 'zod'; // Correct import for zod
import { GenderType, RoleType } from '../../DB/model/user.model';
import tr from 'zod/v4/locales/tr.js';
import { Types } from 'mongoose';
//// works fine #1
// export const signUpSchema = z.object({
//   name: z.string().min(3).max(30).trim(),
//   email:z.email().trim(), // Use z.string().email() for proper email validation
//   password: z.string(),
//   cPassword: z.string(),
// }).required(); 

export enum FlagType {
  all = 'all',
  current = 'current',
}

export const signInSchema = {
  body: z.strictObject({
    email: z.email().trim(), // Use z.string().email() for proper email validation
    password: z.string(),

  }).required()
};
export const loginWithGmailSchema = {
  body: z.strictObject({
    idToken: z.string()
  }).required()
};

export const signUpSchema = {
  body: signInSchema.body.extend({
    userName: z.string().min(3).max(30).trim(),
    email: z.email().trim(), // Use z.string().email() for proper email validation
    password: z.string(),
    cPassword: z.string(),
    age: z.number(),
    adress: z.string(),
    phone: z.string(),
    gender: z.enum([GenderType.male, GenderType.female]),
    role: z.enum([RoleType.user, RoleType.admin]),
  }).required().superRefine((data, ctx) => {
    console.log({ data, ctx });
    if (data.password !== data.cPassword) {
      ctx.addIssue({ code: "custom", path: ["cPassword"], message: "password not matched" })
    }
  })
};

export const confirmEmailSchema = {
  body: z.object({
    email: z.email().trim(), // Use z.string().email() for proper email validation
    otp: z.string().min(6).max(30).trim(),

  }).required()
};

export const logoutSchema = {
  body: z.strictObject({

    flag: z.enum(FlagType)

  }).required()
};

export const resetPasswordSchema = {
  body: confirmEmailSchema.body.extend({
    password: z.string(),
    cPassword: z.string(),

  }).required().superRefine((data, ctx) => {
    console.log({ data, ctx });
    if (data.password !== data.cPassword) {
      ctx.addIssue({ code: "custom", path: ["cPassword"], message: "password not matched" })
    }
  })
};

export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.email().trim(), // Use z.string().email() for proper email validation

  }).required()
};

export const freezedSchema = {
  params: z.strictObject({
    userId: z.string().optional(),
  }).required().refine((value) => {
      return value?.userId ? Types.ObjectId.isValid(value.userId) : true
    }, {
    message: "user id must be at least 3 characters",
    path: ["userId"],
  })
};


export const unfreezedSchema = {
  params: z.strictObject({
    userId: z.string().optional(),
  }).required().refine((value) => {
      return value?.userId ? Types.ObjectId.isValid(value.userId) : true
    }, {
    message: "user id must be at least 3 characters",
    path: ["userId"],
  })
}


// Export the type for signUpSchema
export type SignUpSchemaType = z.infer<typeof signUpSchema.body>;
export type confirmEmailSchema = z.infer<typeof confirmEmailSchema.body>;
export type signInSchema = z.infer<typeof signInSchema.body>;
export type logoutSchema = z.infer<typeof logoutSchema.body>;
export type loginWithGmailSchemaType = z.infer<typeof loginWithGmailSchema.body>;
export type forgetPasswordSchemaType = z.infer<typeof forgetPasswordSchema.body>;
export type resetPasswordSchemaType = z.infer<typeof resetPasswordSchema.body>;
export type freezedSchemaType = z.infer<typeof freezedSchema.params>;
export type unfreezedSchemaType = z.infer<typeof freezedSchema.params>;
