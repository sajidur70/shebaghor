import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

// 401 if there's no valid token. Otherwise sets req.user = { id, role }.
export function requireAuth(req, res, next) {
  const [type, token] = (req.headers.authorization || "").split(" ");
  if (type !== "Bearer" || !token) throw new HttpError(401, "Please log in");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET); // checks signature AND expiry
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new HttpError(401, "Your session expired, please log in again");
  }
  next();
}

// Use AFTER requireAuth. 403 if the user's role isn't in the list.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new HttpError(403, "You are not allowed to do this");
    }
    next();
  };
}
