import { NextFunction, Response } from "express";
import catchAsync from "../utils/catch-async";
import AppError from "../utils/app-error";
import User from "../models/user";

export const follow = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const username = req.body.username;

    if (!username) return next(new AppError("Username is required", 400));

    const user = await User.findOne({ username });
    if (!user) return next(new AppError("User not found", 404));

    const currentUser = req.user;
    if (user.followers.includes(req.user.id))
      return next(new AppError(`Already following ${username}`, 400));

    user.followers.push(req.user.id);
    currentUser.following.push(user.id);
    await user.save();
    await currentUser.save();

    return res.status(200).json({
      status: "success",
      message: "successful",
    });
  },
);

export const unfollow = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const username = req.body.username;

    if (!username) return next(new AppError("Username is required", 400));

    const user = await User.findOne({ username });
    if (!user) return next(new AppError("User not found", 404));

    const currentUser = req.user;

    // ensure current user is actually following target user
    if (!user.followers.includes(currentUser.id)) {
      return next(new AppError(`You are not following ${username}`, 400));
    }

    // remove current user from target user's followers
    user.followers = user.followers.filter(
      (el: any) => el.toString() !== currentUser.id.toString(),
    );

    // remove target user from current user's following list
    currentUser.following = currentUser.following.filter(
      (el: any) => el.toString() !== user.id.toString(),
    );

    await user.save();
    await currentUser.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully unfollowed user",
    });
  },
);

export const listusers = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const currentUser = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim();

    const query: any = {
      _id: { $ne: currentUser.id },
    };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).skip(skip).limit(limit).lean();

    const currentUserId = currentUser.id.toString();

    const formatted = users.map((user: any) => {
      const followers = user.followers || [];

      return {
        ...user,
        followersCount: followers.length,
        following: currentUser.following
          .map((id: any) => id.toString())
          .includes(user._id.toString()),
        follower: followers
          .map((id: any) => id.toString())
          .includes(currentUserId),
      };
    });

    const total = await User.countDocuments(query);

    return res.status(200).json({
      status: "success",
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

export const getProfile = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    const formatted = {
      fullName: user.fullName,
      bio: user.bio,
      username: user.username,
      followers: user.followers.length,
      following: user.following.length,
      email: user.email,
    };

    return res.status(200).json({
      status: "success",
      data: formatted,
    });
  },
);

export const getFollowing = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id)
      .populate("followers", "username fullName bio")
      .populate("following", "username fullName bio");

    if (!user) return next(new AppError("User not found", 404));

    const followingIds = user.following.map((u: any) => u._id.toString());

    const followersWithStatus = user.followers.map((f: any) => {
      const isFollowingBack = followingIds.includes(f._id.toString());

      return {
        ...f.toObject(),
        isFollowingBack,
      };
    });

    const followersIds = user.followers.map((u: any) => u._id.toString());

    const followingWithStatus = user.following.map((f: any) => {
      const isFollowedBy = followersIds.includes(f._id.toString());

      return {
        ...f.toObject(),
        isFollowedBy,
      };
    });

    return res.status(200).json({
      status: "success",
      data: {
        followers: followersWithStatus,
        following: followingWithStatus,
      },
    });
  },
);
