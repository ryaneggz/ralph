import mongoose, { Schema, type Document } from "mongoose";

export interface IAuditLog extends Document {
  userId: string;
  projectId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ projectId: 1, createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

/**
 * Create an audit log entry. Fire-and-forget (does not block the request).
 */
export function logAudit(params: {
  userId: string;
  projectId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): void {
  AuditLog.create(params).catch((err: unknown) => {
    console.error("Failed to create audit log:", err);
  });
}
