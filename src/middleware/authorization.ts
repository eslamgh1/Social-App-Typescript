import { NextFunction, Request, Response } from "express";
import { RoleType } from "../DB/model/user.model";
import { AppError } from "../utils/classError";


//& authorization middleware: / Super Admin - admin - user
export const Authorization = ({ accessRole = [] }: { accessRole: RoleType[] }) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        if (!accessRole.includes(req.user?.role!)) {
            throw new AppError("You are not authorized to access this route", 401);
        }

        return next();
    };

}
