import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import createSendToken from "../utils/jwt";
import xss from "xss";
import validator from "validator";
import AppError from "../utils/app-error";
import catchAsync from "../utils/catch-async";
import { hashPin } from "../utils/hash-password";
import { generateUniqueUsername } from "../utils/generate-username";

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) return next(new AppError("Invalid parameters", 400));

    const { email, fullName, password } = req.body as {
      email?: string;
      fullName?: string;
      password?: string;
    };

    if (!email || !password || !fullName) {
      return next(
        new AppError("Kindly provide a valid name, email, and password", 400),
      );
    }

    if (!validator.isEmail(email)) {
      return next(new AppError("Invalid email format", 400));
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(
        new AppError("User with this email address exists already", 400),
      );
    }

    async function findUserByUsername(username: string) {
      return await User.findOne({ username });
    }

    const username = await generateUniqueUsername(fullName, findUserByUsername);

    const hashed = await hashPin(password);

    const user = await User.create({
      email,
      fullName: xss(fullName),
      password: hashed,
      username,
      following: [],
      followers: [],
    });

    await user.save();

    return createSendToken(user, 200, res);
  },
);

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new AppError("Provide a valid email address and password", 400),
    );

  if (!validator.isEmail)
    return next(new AppError("Invalid email format", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  if (!(await user.verifyPassword(password, String(user.password))))
    return next(new AppError("Login details incorrect", 401));

  user.password = undefined;
  user.passwordChangedAt = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  createSendToken(user, 200, res);
});
