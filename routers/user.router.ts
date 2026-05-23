import express from "express";
import {
  follow,
  listusers,
  unfollow,
  getProfile,
  getFollowing,
  updateProfile,
} from "../controllers/user.controller";
import { userAuthMiddleware } from "../middlewares/auth";

const router = express.Router();

router.get("/", userAuthMiddleware, listusers);
router.patch("/", userAuthMiddleware, updateProfile);
router.get("/profile", userAuthMiddleware, getProfile);
router.get("/following", userAuthMiddleware, getFollowing);
router.post("/follow", userAuthMiddleware, follow);
router.post("/unfollow", userAuthMiddleware, unfollow);

export default router;
