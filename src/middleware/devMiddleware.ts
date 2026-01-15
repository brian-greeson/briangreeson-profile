import type { NextFunction, Request, Response } from "express";

type VentoEnv = {
  cache: {
    clear: () => void;
  };
};

export const devMiddleware = (env: VentoEnv) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    console.log("cleared cache")
    env.cache.clear();
    next();
  };
};
