import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { decrypt, isEncryptionConfigured } from "@/lib/crypto";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.awsAuth) {
    return NextResponse.json(
      { error: "AWS authentication not configured" },
      { status: 400 }
    );
  }

  const { authType } = project.awsAuth;
  const region = project.awsRegion || "us-east-1";

  try {
    let stsClient: STSClient;

    if (authType === "access-keys") {
      const { accessKeyId, secretAccessKeyArn } = project.awsAuth;
      if (!accessKeyId || !secretAccessKeyArn) {
        return NextResponse.json(
          { error: "Access key credentials are incomplete" },
          { status: 400 }
        );
      }

      let secretAccessKey: string;
      if (!isEncryptionConfigured() || secretAccessKeyArn === "pending-encryption") {
        return NextResponse.json(
          { error: "Encryption not configured — cannot decrypt credentials" },
          { status: 500 }
        );
      }
      secretAccessKey = decrypt(secretAccessKeyArn);

      stsClient = new STSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const result = await stsClient.send(new GetCallerIdentityCommand({}));
      return NextResponse.json({
        success: true,
        accountId: result.Account,
        arn: result.Arn,
      });
    } else if (authType === "role") {
      const { roleArn } = project.awsAuth;
      if (!roleArn) {
        return NextResponse.json(
          { error: "Role ARN is missing" },
          { status: 400 }
        );
      }

      // Use default credentials to assume the role
      stsClient = new STSClient({ region });
      const assumeResult = await stsClient.send(
        new AssumeRoleCommand({
          RoleArn: roleArn,
          RoleSessionName: `ralph-test-${Date.now()}`,
          DurationSeconds: 900,
        })
      );

      if (!assumeResult.Credentials) {
        return NextResponse.json(
          { error: "Failed to assume role — no credentials returned" },
          { status: 500 }
        );
      }

      const assumedClient = new STSClient({
        region,
        credentials: {
          accessKeyId: assumeResult.Credentials.AccessKeyId!,
          secretAccessKey: assumeResult.Credentials.SecretAccessKey!,
          sessionToken: assumeResult.Credentials.SessionToken,
        },
      });

      const identity = await assumedClient.send(new GetCallerIdentityCommand({}));
      return NextResponse.json({
        success: true,
        accountId: identity.Account,
        arn: identity.Arn,
      });
    }

    return NextResponse.json({ error: "Unknown auth type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection test failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
