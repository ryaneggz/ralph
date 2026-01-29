export interface RepoConfig {
  url: string;
  branch: string;
  accessToken?: string; // For private repos — stored in Secrets Manager, referenced by secret ARN
}

export interface AgentEnvVar {
  key: string;
  value: string; // Stored encrypted in Secrets Manager
  source: "user" | "platform"; // "platform" = auto-injected from provider keys
}

export interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  repo?: RepoConfig;
  agentEnvVars: AgentEnvVar[];
  awsRegion: string;
  idleTimeoutMinutes: number;
  defaultProvider?: string;
  createdAt: Date;
  updatedAt: Date;
}
