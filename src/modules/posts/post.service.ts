import { Request, Response, NextFunction } from "express";
import postModel, { availabilityEnum, IPost } from "../../DB/model/post.model";
import userModel from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { PostRepository } from "../../DB/repositories/post.repository";
import { AppError } from "../../utils/classError";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { uuidv4 } from "zod";
import { ActionEnum, likePostSchemaQueryType, likePostSchemaType, updatePostSchemaType } from "./post.validation";
import { UpdateQuery } from "mongoose";

class PostService {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(postModel);

  constructor() { }

  //^  ===================== createPost =====================//
  createPost = async (req: Request, res: Response, next: NextFunction) => {

    if (req?.body?.tags?.length
      &&
      (await this._userModel.find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length) {
      throw new AppError("Invalid user Id", 400)
    }

    // const assetFolderId = uuidv4();

    const assetFolderId = Date.now();
    let attachments: string[] = []

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req?.files as unknown as Express.Multer.File[],
        path: `users/${req?.user?._id}/${assetFolderId}`
      })
    }

    const post = await this._postModel.create({
      ...req.body,
      attachments,
      assetFolderId,
      createdBy: req.user?._id
    })

    if (!post) {
      await deleteFiles({
        urls: attachments || []
      })
      throw new AppError("Faild to create post", 500)
    }

    res.status(201).json({ message: "createPost - Success", post });
  };

  //^ ===================== Like =====================//
  likePost = async (req: Request, res: Response, next: NextFunction) => {

    const { postId }: likePostSchemaType = req.params as likePostSchemaType
    const { action }: likePostSchemaQueryType = req.query as likePostSchemaQueryType

    let updateQuery: UpdateQuery<IPost> = { $addToSet: { likes: req.user?._id } }

    if (action === ActionEnum.unlike) {
      updateQuery = { $pull: { likes: req.user?._id } }
    }

    const post = await this._postModel.findOneAndUpdate({
      _id: postId, $or: [
        { availability: availabilityEnum.public },
        { availability: availabilityEnum.private, createdBy: req.user?._id },
        { availability: availabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user?._id] } },

      ]
    }, updateQuery, { new: true })


    if (!post) {
      throw new AppError("Faild to like post", 500)
    }


    res.status(201).json({ message: `${action}`, post });
  };

  //^ ===================== Update Post =====================//
  updatePost = async (req: Request, res: Response, next: NextFunction) => {

    // const body: updatePostSchemaType = req.body as updatePostSchemaType; // ignore
    const { postId }: likePostSchemaType = req.params as likePostSchemaType

    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id,
      paranoid: true // ignore deletedAt if true ,, if false then include deletedAt
    }
    )

    if (!post) {
      throw new AppError("Faild to update post or unauthorized", 500)
    }

    if (req?.body?.content) {
      post.content = req.body.content
    }

    if (req?.body?.availability) {
      post.availability = req.body.availability
    }

    if (req?.body?.allowComment) {
      post.allowComment = req.body.allowComment
    }

    if (req?.files?.length) {
      // delete old attachments
      await deleteFiles({
        urls: post.attachments || []
      })
      // upload new attachments
      post.attachments = await uploadFiles({
        files: req?.files as unknown as Express.Multer.File[],
        path: `users/${req?.user?._id}/${post.assetFolderId}`
      })
    }

    if (req.body.tags) {
      if (
        req.body.tags.length &&
        (await this._userModel.find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length
      ) {
        throw new AppError("Invalid user Id", 400)
      }

      post.tags = req.body.tags
    }

    await post.save();



    res.status(201).json({ message: "updatePost - Success", post });
  };

  //^ =====================  Get posts =====================//
  getPosts = async (req: Request, res: Response, next: NextFunction) => {

    const posts = await this._postModel.findNamed({
      filter: {},
      // options:{populate:"Comments"}
      options: {
        populate: [
          { path: "Comments",
            match:{
            commentId: { $exists: false }
          },populate:{
            path:"replies",
            match:{
              commentId: { $exists: false }
            }
          }
        
        
        }
        ]
      }

    })

    let { page = 1, limit = 5 } = req.query as unknown as { page: number, limit: number }
    const {currentPage , docs ,totalDocs,numPages} = await this._postModel.paginate({
      filter: {
        // availability: availabilityEnum.public
      },query: { page, limit }
    })

    res.status(201).json({ message: "getPosts - Success", posts });

    // res.status(201).json({ message: "getPosts - Success",totalDocs: totalDocs, page: currentPage , numPages , "doscs": docs ,posts  });
  };


    //^ =====================  Get post by ID =====================//
  getPostById = async (req: Request, res: Response, next: NextFunction) => {

    const {postId}: likePostSchemaType = req.params as likePostSchemaType

    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id,
      paranoid: true // 
    }
    )

    if (!post) {
      throw new AppError("Invalid post Id or You are not authorized", 400)
    }

    let { page = 1, limit = 5 } = req.query as unknown as { page: number, limit: number }
    const {currentPage , docs ,totalDocs,numPages} = await this._postModel.paginate({
      filter: {
        // availability: availabilityEnum.public
      },query: { page, limit }
    })

    res.status(201).json({ message: "getPosts - Success", post });

  };

  //^ =====================  Get post by ID =====================//

  deletePost =  async (req: Request, res: Response, next: NextFunction) => {

    const {postId}: likePostSchemaType = req.params as likePostSchemaType

    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id,
      paranoid: true // 
    }
    )

    if (!post) {
      throw new AppError("Invalid post Id or You are not authorized", 400)
    }

    await post.deleteOne()

    res.status(201).json({ message: "deletePost - Success", post });

  }


  //^ ===================== next Post =====================//

}

export default new PostService();