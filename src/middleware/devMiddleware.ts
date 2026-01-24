import type { NextFunction, Request, Response } from "express";

type VentoEnv = {
  cache: {
    clear: () => void;
  };
};

export const devMiddleware = (vento: VentoEnv) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    console.log("cleared cache")
    vento.cache.clear();
    console.log("Route:", _req.path);
    next();
  };
};
