
import { Dbrepositories } from "./db.repositories";
import { IRrevokeToken } from "../model/revoke.model";
import { Model } from 'mongoose';


export class RevokeTokenRepository extends Dbrepositories<IRrevokeToken> {
constructor(protected readonly model: Model<IRrevokeToken>) {
    super(model);
  }


 
}