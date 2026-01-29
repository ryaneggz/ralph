import type { IIacFile } from "@/lib/models/project";

interface GenerateOptions {
  projectName: string;
  awsRegion: string;
}

function generateFargate(opts: GenerateOptions): IIacFile[] {
  return [
    {
      path: "Pulumi.yaml",
      content: `name: ${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra
runtime: nodejs
description: ECS Fargate infrastructure for ${opts.projectName}
`,
    },
    {
      path: "index.ts",
      content: `import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const region = "${opts.awsRegion}";

// VPC
const vpc = new aws.ec2.Vpc("ralph-vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { Name: "ralph-vpc" },
});

const publicSubnet1 = new aws.ec2.Subnet("public-subnet-1", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: \`\${region}a\`,
  mapPublicIpOnLaunch: true,
  tags: { Name: "ralph-public-1" },
});

const publicSubnet2 = new aws.ec2.Subnet("public-subnet-2", {
  vpcId: vpc.id,
  cidrBlock: "10.0.2.0/24",
  availabilityZone: \`\${region}b\`,
  mapPublicIpOnLaunch: true,
  tags: { Name: "ralph-public-2" },
});

const igw = new aws.ec2.InternetGateway("ralph-igw", {
  vpcId: vpc.id,
});

const routeTable = new aws.ec2.RouteTable("ralph-rt", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
});

new aws.ec2.RouteTableAssociation("rt-assoc-1", {
  subnetId: publicSubnet1.id,
  routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation("rt-assoc-2", {
  subnetId: publicSubnet2.id,
  routeTableId: routeTable.id,
});

// ECS Cluster
const cluster = new aws.ecs.Cluster("ralph-cluster", {});

// Task Execution Role
const executionRole = new aws.iam.Role("task-exec-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ecs-tasks.amazonaws.com" },
    }],
  }),
});

new aws.iam.RolePolicyAttachment("exec-role-policy", {
  role: executionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// Task Role
const taskRole = new aws.iam.Role("task-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ecs-tasks.amazonaws.com" },
    }],
  }),
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup("ralph-logs", {
  retentionInDays: 14,
});

// Security Group
const sg = new aws.ec2.SecurityGroup("ralph-sg", {
  vpcId: vpc.id,
  egress: [{
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  }],
});

// Task Definition
const taskDef = new aws.ecs.TaskDefinition("ralph-task", {
  family: "ralph-agent",
  cpu: "512",
  memory: "1024",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  executionRoleArn: executionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: pulumi.jsonStringify([{
    name: "ralph-agent",
    image: "ubuntu:22.04",
    essential: true,
    logConfiguration: {
      logDriver: "awslogs",
      options: {
        "awslogs-group": logGroup.name,
        "awslogs-region": region,
        "awslogs-stream-prefix": "ralph",
      },
    },
  }]),
});

// ECS Service
const service = new aws.ecs.Service("ralph-service", {
  cluster: cluster.arn,
  taskDefinition: taskDef.arn,
  desiredCount: 0,
  launchType: "FARGATE",
  networkConfiguration: {
    subnets: [publicSubnet1.id, publicSubnet2.id],
    securityGroups: [sg.id],
    assignPublicIp: true,
  },
});

export const clusterArn = cluster.arn;
export const serviceArn = service.id;
export const taskDefinitionArn = taskDef.arn;
`,
    },
    {
      path: "package.json",
      content: `{
  "name": "${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra",
  "main": "index.ts",
  "dependencies": {
    "@pulumi/pulumi": "^3",
    "@pulumi/aws": "^6"
  }
}
`,
    },
  ];
}

function generateLambda(opts: GenerateOptions): IIacFile[] {
  return [
    {
      path: "Pulumi.yaml",
      content: `name: ${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra
runtime: nodejs
description: Lambda infrastructure for ${opts.projectName}
`,
    },
    {
      path: "index.ts",
      content: `import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const region = "${opts.awsRegion}";

// Lambda Execution Role
const lambdaRole = new aws.iam.Role("ralph-lambda-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
    }],
  }),
});

new aws.iam.RolePolicyAttachment("lambda-basic-policy", {
  role: lambdaRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup("ralph-lambda-logs", {
  retentionInDays: 14,
});

// SQS Queue for task dispatching
const taskQueue = new aws.sqs.Queue("ralph-task-queue", {
  visibilityTimeoutSeconds: 900,
  messageRetentionSeconds: 86400,
});

// Lambda Function
const agentFn = new aws.lambda.Function("ralph-agent", {
  runtime: "nodejs20.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  timeout: 900,
  memorySize: 512,
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(
      'exports.handler = async (event) => { console.log("Ralph agent invoked", event); return { statusCode: 200 }; }'
    ),
  }),
  environment: {
    variables: {
      QUEUE_URL: taskQueue.url,
    },
  },
});

// SQS Event Source Mapping
new aws.lambda.EventSourceMapping("ralph-sqs-trigger", {
  eventSourceArn: taskQueue.arn,
  functionName: agentFn.arn,
  batchSize: 1,
});

export const functionArn = agentFn.arn;
export const queueUrl = taskQueue.url;
`,
    },
    {
      path: "package.json",
      content: `{
  "name": "${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra",
  "main": "index.ts",
  "dependencies": {
    "@pulumi/pulumi": "^3",
    "@pulumi/aws": "^6"
  }
}
`,
    },
  ];
}

function generateEc2Spot(opts: GenerateOptions): IIacFile[] {
  return [
    {
      path: "Pulumi.yaml",
      content: `name: ${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra
runtime: nodejs
description: EC2 Spot infrastructure for ${opts.projectName}
`,
    },
    {
      path: "index.ts",
      content: `import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const region = "${opts.awsRegion}";

// VPC
const vpc = new aws.ec2.Vpc("ralph-vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { Name: "ralph-vpc" },
});

const publicSubnet = new aws.ec2.Subnet("public-subnet", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: \`\${region}a\`,
  mapPublicIpOnLaunch: true,
  tags: { Name: "ralph-public" },
});

const igw = new aws.ec2.InternetGateway("ralph-igw", {
  vpcId: vpc.id,
});

const routeTable = new aws.ec2.RouteTable("ralph-rt", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
});

new aws.ec2.RouteTableAssociation("rt-assoc", {
  subnetId: publicSubnet.id,
  routeTableId: routeTable.id,
});

// IAM Instance Profile
const role = new aws.iam.Role("ralph-instance-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ec2.amazonaws.com" },
    }],
  }),
});

new aws.iam.RolePolicyAttachment("ssm-policy", {
  role: role.name,
  policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
});

const instanceProfile = new aws.iam.InstanceProfile("ralph-profile", {
  role: role.name,
});

// Security Group
const sg = new aws.ec2.SecurityGroup("ralph-sg", {
  vpcId: vpc.id,
  egress: [{
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  }],
});

// Get latest Ubuntu AMI
const ami = aws.ec2.getAmiOutput({
  mostRecent: true,
  filters: [
    { name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"] },
    { name: "virtualization-type", values: ["hvm"] },
  ],
  owners: ["099720109477"],
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup("ralph-spot-logs", {
  retentionInDays: 14,
});

// Spot Fleet Request
const spotRequest = new aws.ec2.SpotInstanceRequest("ralph-spot", {
  ami: ami.id,
  instanceType: "t3.medium",
  spotType: "one-time",
  iamInstanceProfile: instanceProfile.name,
  subnetId: publicSubnet.id,
  vpcSecurityGroupIds: [sg.id],
  userData: \`#!/bin/bash
echo "Ralph agent starting..."
# Agent bootstrap will be injected here
\`,
  tags: { Name: "ralph-agent-spot" },
});

export const spotInstanceId = spotRequest.spotInstanceId;
export const publicIp = spotRequest.publicIp;
`,
    },
    {
      path: "package.json",
      content: `{
  "name": "${opts.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-infra",
  "main": "index.ts",
  "dependencies": {
    "@pulumi/pulumi": "^3",
    "@pulumi/aws": "^6"
  }
}
`,
    },
  ];
}

const generators: Record<string, (opts: GenerateOptions) => IIacFile[]> = {
  fargate: generateFargate,
  lambda: generateLambda,
  "ec2-spot": generateEc2Spot,
};

export function generateIacFiles(
  templateId: string,
  opts: GenerateOptions
): IIacFile[] | null {
  const generator = generators[templateId];
  if (!generator) return null;
  return generator(opts);
}
