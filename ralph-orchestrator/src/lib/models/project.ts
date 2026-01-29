import mongoose, { Schema, type Document } from "mongoose";

export interface IProject extends Document {
  userId: string;
  name: string;
  description?: string;
  repoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    repoUrl: { type: String },
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project ??
  mongoose.model<IProject>("Project", ProjectSchema);
