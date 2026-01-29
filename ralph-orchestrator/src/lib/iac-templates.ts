export interface IacTemplate {
  id: string;
  name: string;
  description: string;
  estimatedCostRange: string;
}

export const IAC_TEMPLATES: IacTemplate[] = [
  {
    id: "fargate",
    name: "ECS Fargate",
    description:
      "Serverless containers on AWS Fargate. No server management, auto-scaling, pay per vCPU/memory second.",
    estimatedCostRange: "$30–$150/mo",
  },
  {
    id: "lambda",
    name: "AWS Lambda",
    description:
      "Event-driven functions with 15-minute max execution. Best for short-lived agent tasks. Pay per invocation.",
    estimatedCostRange: "$5–$50/mo",
  },
  {
    id: "ec2-spot",
    name: "EC2 Spot",
    description:
      "Spot instances for up to 90% cost savings. Best for fault-tolerant, long-running agent workloads.",
    estimatedCostRange: "$10–$80/mo",
  },
];

export const IAC_TEMPLATE_IDS = IAC_TEMPLATES.map((t) => t.id);
