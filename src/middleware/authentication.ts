
import { decodedTokenAndFetchUser, GenerateSignature, VerifyToken, TokenType } from './../utils/token';
import { NextFunction, Request, Response } from "express";
import { AppError } from '../utils/classError';


//& Authentication middleware:
export const Authentication = (tokenType:TokenType =TokenType.access)=>{
  return async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new AppError("Provide us with token", 404);
  }
  //& split the token
  const [prefix, token] = authorization.split(" ") || [];
  if (!prefix || !token) {
    throw new AppError("Provide us with valid token/prefix", 409);
  }
  //& generate signature
  const signature = await GenerateSignature(tokenType, prefix)
  if (!signature) {
    throw new AppError("Invalid Signature", 400);
  }
//& decode token and fetch user
const decoded = await decodedTokenAndFetchUser(token, signature);
if (!decoded) {
  throw new AppError("Invalid Token decoded", 400);
}

  req.user = decoded?.user;
  req.decoded = decoded?.decoded;

  return next();
};

}
