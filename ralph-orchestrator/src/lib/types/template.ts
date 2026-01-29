export interface Template {
  _id: string;
  name: string;
  description: string;
  dockerImage: string;
  envVars: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
