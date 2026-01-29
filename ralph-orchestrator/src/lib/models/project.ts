import mongoose, { Schema, type Document } from "mongoose";

export interface IRepoConfig {
  url: string;
  branch: string;
  accessTokenArn?: string;
}

export interface IProject extends Document {
  userId: string;
  name: string;
  description?: string;
  repoUrl?: string;
  repo?: IRepoConfig;
  createdAt: Date;
  updatedAt: Date;
}

const RepoConfigSchema = new Schema<IRepoConfig>(
  {
    url: { type: String, required: true },
    branch: { type: String, required: true, default: "main" },
    accessTokenArn: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    repoUrl: { type: String },
    repo: { type: RepoConfigSchema },
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project ??
  mongoose.model<IProject>("Project", ProjectSchema);
