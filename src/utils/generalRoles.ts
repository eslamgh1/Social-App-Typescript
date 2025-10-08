import { z } from 'zod';
import mongoose from 'mongoose';

export const generalRules = {
  id: z.string().refine((value) => {
    return mongoose.Types.ObjectId.isValid(value);
  }, { message: "Invalid user id" }),
  
  email: z.email(),
  
  password: z.string().regex(/.*[0-9].*/, {
    message: "Password must contain at least 6 numbers"
  }), 
  otp:z.string().regex(/.*[0-9].*/),

  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(), // Fixed typo: was "minetype"
    buffer: z.instanceof(Buffer).optional(), //storage at memory
    path: z.string().optional(),//storaage at buffer
    size: z.number()
  })
};