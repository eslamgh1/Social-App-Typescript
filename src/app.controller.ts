import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve('./config/.env') });
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { error } from 'console';
import { AppError } from './utils/classError';
import userRouter from './modules/users/user.controller';
import connectionDB from './DB/connection.DB';
import userModel, { GenderType } from './DB/model/user.model';
import { v4 as uuidv4 } from 'uuid';
import postRouter from './modules/posts/post.controller';
import commentRouter from './modules/comments/comment.controller';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  // standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  message: 'Too many requests from this IP, please try again after an hour',
  statusCode: 429, // 429 status = Too Many Requests (RFC 6585)

})

const app: express.Application = express();
const port: string | number = process.env.PORT || 5000;



const bootsrap = async () => {

  // Third party Modules
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(limiter);

  // Application Routes
  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "Welocme to my Social App - Backend" })
  }
  );

  app.use("/users", userRouter);
  app.use("/posts", postRouter);




  await connectionDB();

  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`Page not found ---Invalid route - ${req.originalUrl}`, 404);
  }
  );


  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    return res.status(err.statusCode as unknown as number || 500).json({ message: err.message, stack: err.stack })
  })


  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);

  })
};


export default bootsrap;  