import { Request, Response, NextFunction } from "express";

import { verifyToken } from "../utils/jwt";


export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const authHeader =
      req.headers.authorization;


    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }


    const token =
      authHeader.split(" ")[1];


    if (!token) {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }


    const decoded =
  verifyToken(token) as {
    userId: string;
    role: string;
  };


if (decoded.role !== "ADMIN") {
  return res.status(403).json({
    message:
      "Admin access required.",
  });
}


// Make authenticated admin available
// to downstream controllers.

res.locals.user = {

  id: decoded.userId,

  role: decoded.role,

};


next();


  } catch (error) {

    return res.status(401).json({
      message:
        "Invalid or expired token.",
    });

  }
}




