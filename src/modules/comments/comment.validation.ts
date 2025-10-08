
import { object, z } from 'zod';
import { allowCommentEnum, availabilityEnum } from '../../DB/model/post.model';
import mongoose from 'mongoose';
import { generalRules } from '../../utils/generalRoles';
import { onModelEnum } from '../../DB/model/comment.model';



export const createCommentSchema = {

  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id.optional(),
  }),
  
  body: z.strictObject({
    content: z.string().min(1).max(10000).optional(),
    attachments: z
      .array(
        generalRules.file)
      .max(2)
      .optional(),

    tags: z.array(generalRules.id).refine((value) => {
      return new Set(value).size === value?.length;
    }, { message: 'Dublicated tags' })
      .optional(),
    onModel: z.enum(onModelEnum).optional(),


  }).superRefine((data, ctx) => {
    if (!data?.content && (!data.attachments || data.attachments.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'Comment is empty and no attachments provided',
      });
    }
  }),
};


export type createCommentSchemaType = z.infer<typeof createCommentSchema.body>;
