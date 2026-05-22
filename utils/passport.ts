import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import dotenv from "dotenv";
import crypto from "crypto";
import { VerifyCallback } from "passport-oauth2";

import User from "../models/user";

dotenv.config();

const randomPassword = crypto.randomBytes(20).toString("hex");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            // googleId: profile.id,
            fullName: profile.name?.givenName,
            email,
            provider: "google",
            password: randomPassword,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err as Error, null);
  }
});

export default passport;
