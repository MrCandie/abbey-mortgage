import jwt from "jsonwebtoken";
import catchAsync from "../utils/catch-async";
import AppError from "../utils/app-error";
import User from "../models/user";
import { MyUser } from "../constants";

export const userAuthMiddleware = catchAsync(
  async (req: any, res: any, next: any) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new AppError("unauthenticated", 401));

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(
          new AppError(
            "unauthenticated, Session expired. Please log in again.",
            401,
          ),
        );
      }
      return next(
        new AppError(
          "unauthenticated, Invalid token. Please log in again.",
          401,
        ),
      );
    }

    const user: MyUser | null = await User.findById(decoded?.id);

    if (!user) return next(new AppError("user not found", 404));

    req.user = user;
    next();
  },
);
