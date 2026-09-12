import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found." });
}

export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<any>) {
  return (req: any, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}
