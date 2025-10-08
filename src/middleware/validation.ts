import { NextFunction, Request, Response } from "express"

import { ZodType } from "zod"

import { AppError } from "../utils/classError"



//? object = key & value
type requestType = keyof Request   //? keyof Request =  body | params| query

//? <Record> to assign type to key & value // Partial to make it optional
type schemaType = Partial<Record<requestType, ZodType>>

export const validation = (schema: schemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {

    const validationError = []

    //? for...of loop to loop through the object keys such as body, params, query
    for (const key of Object.keys(schema) as requestType[]) {
      if (!schema[key]) continue;
      // Action by schema[key] if it exists == in result

  if (req.file) {
  req.body.attachments = req.file; // req.file is a single file object
}
if (req.files) {
  req.body.attachments = req.files; // req.files is an array of file objects
}

      const result = schema[key].safeParse(req[key])
      //===============If validation fails, push the error to validationError array ===============//
      if (!result.success) {
        validationError.push(result.error)
      }
      //===============End: If validation fails, push the error to validationError array ===============//
    }

    //?=================End for...of loop =================================//

    if (validationError.length) {
      throw new AppError(JSON.parse(validationError as unknown as string), 400)

    }


    //? if no error, proceed to next middleware or controller
    next()
  }
}