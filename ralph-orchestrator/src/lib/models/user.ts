import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  emailVerified?: Date;
  password?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date },
    password: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
