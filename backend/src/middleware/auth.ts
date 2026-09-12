import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthedRequest extends Request {
  userId?: string;
}

// Reads the JWT from the httpOnly cookie (preferred) or an Authorization
// header (fallback, useful for non-browser clients / tests). The userId is
// NEVER read from the request body/query - it always comes from the verified
// token, so a user can never impersonate another user's id.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.token;
  const header = req.headers.authorization;
  const headerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
