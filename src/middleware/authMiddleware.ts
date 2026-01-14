import type {NextFunction, Response, Request}  from "express"

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  //TODO: grab user from db if userId is available in session
 console.log(`${req.method} ${req.path}`)
  next()

}