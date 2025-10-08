import { Request, Response, NextFunction } from "express";
import postModel, { allowCommentEnum, availabilityEnum, IPost } from "../../DB/model/post.model";
import userModel from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { PostRepository } from "../../DB/repositories/post.repository";
import { AppError } from "../../utils/classError";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { any, uuidv4 } from "zod";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import commentModel, { Icomment, onModelEnum } from "../../DB/model/comment.model";
import { CommentRepository } from "../../DB/repositories/comment.repository";

class CommentService {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(postModel);
  private _commentModel = new CommentRepository(commentModel);

  constructor() { }

  //^  ===================== create Comment or Reply =====================//
  createComment = async (req: Request, res: Response, next: NextFunction) => {

    const { postId, commentId } = req.params;
    let { content, attachments, tags, onModel } = req.body;

    let doc: HydratedDocument<IPost | Icomment> | null = null;

    // create reply on comment as per commentId[reply]
    if (commentId || onModel == onModelEnum.comment) {

      if (!commentId) {
        throw new AppError("Invalid comment Id or You are not authorized", 400)
      }

 
      const comment = await this._commentModel.findOne({
        _id: commentId,
        refId: postId,
      }, {
        populate: {
          path: "refId",
          match: {
            allowComment: allowCommentEnum.allow,
            $or: [{ availability: availabilityEnum.public }],
          }
        }
      })

      if (!comment?.refId) {
        throw new AppError("Invalid comment Id or You are not authorized", 400)
      }

      doc = comment;

    } else if (onModel == onModelEnum.post) {

      if (commentId) {
        throw new AppError("Invalid comment Id or You are not authorized", 400)
      }


      doc = await this._postModel.findOne({
        _id: postId,
        allowCommentEnum: allowCommentEnum.allow,
        $or: [{ availability: availabilityEnum.public }],
        //  $or: availability(req)  // Ignore &check
      })
      if (!doc) {
        throw new AppError("Invalid post Id or You are not authorized", 400)
      }
      
    }


    if (req?.body?.tags?.length
      &&
      (await this._userModel.find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length) {
      throw new AppError("Invalid user Id", 400)
    }

    // // const assetFolderId = uuidv4(); ignore as I used Date.now();
    const assetFolderId = Date.now();

    // let attachments: string[] = []

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req?.files as unknown as Express.Multer.File[],
        path: `users/${doc?.createdBy}/posts/${doc?.assetFolderId}/comments/${assetFolderId}`
      })
    }

    const comment = await this._commentModel.create({
      content,
      tags,
      attachments,
      assetFolderId: assetFolderId as any,  // by me = assetFolderId as any
      refId: doc?._id as unknown as Types.ObjectId,
      onModel,
      createdBy: req.user?._id as unknown as Types.ObjectId
    })

    if (!comment) {
      await deleteFiles({
        urls: attachments || []
      })
      throw new AppError("Faild to create comment", 500)
    }

    res.status(201).json({ message: "create Coment or Reply - Success", comment });
  };


  //^ ===================== next()  =====================//

}

export default new CommentService();