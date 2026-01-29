export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface Task {
  _id: string;
  userId: string;
  agentId?: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}
