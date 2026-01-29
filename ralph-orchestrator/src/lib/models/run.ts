import mongoose, { Schema, type Document } from "mongoose";

export type RunType = "plan" | "apply" | "destroy";
export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface IRun extends Document {
  projectId: string;
  userId: string;
  type: RunType;
  status: RunStatus;
  provider: string;
  logs: string[];
  statusHistory: { status: RunStatus; timestamp: Date }[];
  threadId: string | null;
  emailSubject: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RunSchema = new Schema<IRun>(
  {
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["plan", "apply", "destroy"], required: true },
    status: {
      type: String,
      enum: ["queued", "running", "succeeded", "failed", "canceled"],
      required: true,
      default: "queued",
    },
    provider: { type: String, required: true },
    logs: { type: [String], default: [] },
    threadId: { type: String, default: null },
    emailSubject: { type: String, default: null },
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          timestamp: { type: Date, required: true, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Run =
  mongoose.models.Run ?? mongoose.model<IRun>("Run", RunSchema);
