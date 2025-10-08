
import { object, z } from 'zod';
import { allowCommentEnum, availabilityEnum } from '../../DB/model/post.model';
import mongoose from 'mongoose';
import { generalRules } from '../../utils/generalRoles';


export enum ActionEnum {
  like = 'like',
  unlike = 'unlike',
}

export const createPostSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(10000).optional(),    // ...
    attachments: z
      .array(
        generalRules.file)
      .max(2)
      .optional(),
    assetFolderId: z.string().optional(),

    allowComment: z.enum(allowCommentEnum).default(allowCommentEnum.allow).optional(),
    availability: z.enum(availabilityEnum).default(availabilityEnum.public).optional(),

    tags: z.array(generalRules.id).refine((value) => {
      return new Set(value).size === value?.length;
    }, { message: 'Dublicated tags' })
      .optional(),


  }).superRefine((data, ctx) => {
    if (!data?.content && (!data.attachments || data.attachments.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'Content is empty and no attachments provided',
      });
    }
  }),
};

export const likePostSchema = {
  params: z.strictObject({
    postId: generalRules.id
  }),

  query: z.strictObject({
    action: z.enum(ActionEnum).default(ActionEnum.like)
  }),

};


// need to adjust
// export const updatePostSchema = {
//   body: z.strictObject({
//     content: z.string().min(1).max(10000).optional(),    // ...
//     attachments: z
//       .array(
//         generalRules.file)
//       .max(2)
//       .optional(),
//     assetFolderId: z.string().optional(),

//     allowComment: z.enum(allowCommentEnum).default(allowCommentEnum.allow).optional(),
//     availability: z.enum(availabilityEnum).default(availabilityEnum.public).optional(),

//     tags: z.array(generalRules.id).refine((value) => {
//       return new Set(value).size === value?.length;
//     }, { message: 'Dublicated tags' })
//       .optional(),

//     }).superRefine((data, ctx) => {
//     if (!Object.values(data).length) {
//       ctx.addIssue({
//         code: 'custom',
//         // path: ['content'],
//         message: 'All fields are empty',
//       });
//     }
//   }),
// };

export const updatePostSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(10000).optional(),
    attachments: z.array(generalRules.file).max(2).optional(),
    assetFolderId: z.string().optional(),

    allowComment: z.enum(allowCommentEnum).default(allowCommentEnum.allow).optional(),
    availability: z.enum(availabilityEnum).default(availabilityEnum.public).optional(),

    tags: z.array(generalRules.id).refine((value) => {
      return new Set(value).size === value?.length;
    }, { message: 'Duplicated tags' }).optional(),
  })
  .default({}) // ✅ ensures undefined body becomes {}
  .superRefine((data, ctx) => {
    if (!Object.values(data).length) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'All fields are empty',
      });
    }
  }),
};

export type createPostSchemaType = z.infer<typeof createPostSchema.body>;
export type likePostSchemaType = z.infer<typeof likePostSchema.params>;
export type likePostSchemaQueryType = z.infer<typeof likePostSchema.query>;
export type updatePostSchemaType = z.infer<typeof updatePostSchema.body>;