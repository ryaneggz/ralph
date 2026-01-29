import mongoose, { Schema, type Document } from "mongoose";

export interface IRepoConfig {
  url: string;
  branch: string;
  accessTokenArn?: string;
}

export interface IEnvVar {
  key: string;
  valueArn: string;
  source: "platform" | "user";
  maskedValue: string;
}

export interface IProviderKey {
  provider: string;
  keyArn: string;
  maskedValue: string;
}

export interface IIacFile {
  path: string;
  content: string;
}

export interface IIacVersion {
  versionId: string;
  label: "draft" | "applied" | "generated";
  files: IIacFile[];
  createdAt: Date;
}

export interface IAwsAuth {
  authType: "role" | "access-keys";
  roleArn?: string;
  accessKeyId?: string;
  secretAccessKeyArn?: string;
  maskedSecretKey?: string;
}

export interface IProject extends Document {
  userId: string;
  name: string;
  description?: string;
  repoUrl?: string;
  repo?: IRepoConfig;
  envVars?: IEnvVar[];
  providerKeys?: IProviderKey[];
  awsRegion?: string;
  awsAuth?: IAwsAuth;
  iacTemplate?: string;
  iacFiles?: IIacFile[];
  iacDraftFiles?: IIacFile[];
  iacDraftUpdatedAt?: Date;
  iacVersions?: IIacVersion[];
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

const EnvVarSchema = new Schema<IEnvVar>(
  {
    key: { type: String, required: true },
    valueArn: { type: String, required: true },
    source: { type: String, enum: ["platform", "user"], required: true, default: "user" },
    maskedValue: { type: String, required: true },
  },
  { _id: false }
);

const ProviderKeySchema = new Schema<IProviderKey>(
  {
    provider: { type: String, required: true },
    keyArn: { type: String, required: true },
    maskedValue: { type: String, required: true },
  },
  { _id: false }
);

const AwsAuthSchema = new Schema<IAwsAuth>(
  {
    authType: { type: String, enum: ["role", "access-keys"], required: true },
    roleArn: { type: String },
    accessKeyId: { type: String },
    secretAccessKeyArn: { type: String },
    maskedSecretKey: { type: String },
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
    envVars: { type: [EnvVarSchema], default: [] },
    providerKeys: { type: [ProviderKeySchema], default: [] },
    awsRegion: { type: String, default: "us-east-1" },
    awsAuth: { type: AwsAuthSchema },
    iacTemplate: { type: String },
    iacFiles: {
      type: [{ path: { type: String, required: true }, content: { type: String, required: true } }],
      default: [],
    },
    iacDraftFiles: {
      type: [{ path: { type: String, required: true }, content: { type: String, required: true } }],
      default: undefined,
    },
    iacDraftUpdatedAt: { type: Date },
    iacVersions: {
      type: [
        {
          versionId: { type: String, required: true },
          label: { type: String, enum: ["draft", "applied", "generated"], required: true },
          files: {
            type: [{ path: { type: String, required: true }, content: { type: String, required: true } }],
            required: true,
          },
          createdAt: { type: Date, required: true, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project ??
  mongoose.model<IProject>("Project", ProjectSchema);
