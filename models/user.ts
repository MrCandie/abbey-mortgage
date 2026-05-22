import mongoose, { Document, Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  fullName: string;
  email: string;
  provider: string | undefined;
  username: string | undefined;
  password: string | undefined;
  followers: any[];
  following: any[];
  passwordChangedAt?: Date;
  passwordResetExpires?: Date;
  passwordResetToken?: string;
  accountVerificationToken?: string;

  verifyPassword(enteredPassword: string, password: string): Promise<boolean>;

  createPasswordResetToken(): string;
  createAccountVerificationToken(): string;
  passwordChanged(jwtTime: number): boolean;
}

const schema = new mongoose.Schema<IUser>(
  {
    fullName: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      validate: [validator.isEmail, "enter a valid email address"],
    },

    username: { type: String, trim: true, default: "" },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],

    password: {
      type: String,
      trim: true,
      minlength: [7, "password cannot be less than 7 digits"],
      required: [true, "enter a valid password"],
      select: false,
    },

    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetToken: String,
    accountVerificationToken: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

schema.methods.verifyPassword = async function (
  enteredPassword: string,
  password: string,
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, password);
};

schema.methods.passwordChanged = function (jwtTime: number): boolean {
  if (this.passwordChangedAt) {
    const passwordTimeStamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );
    return jwtTime < passwordTimeStamp;
  }
  return false;
};

const User: Model<IUser> = mongoose.model<IUser>("User", schema);

export default User;
