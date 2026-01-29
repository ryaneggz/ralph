export type AgentStatus =
  | "provisioning"
  | "running"
  | "idle"
  | "stopped"
  | "failed";

export interface AgentEvent {
  agentId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface Agent {
  _id: string;
  userId: string;
  name: string;
  status: AgentStatus;
  templateId: string;
  ecsTaskArn?: string;
  createdAt: Date;
  updatedAt: Date;
}
