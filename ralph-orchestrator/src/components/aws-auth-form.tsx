"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AwsAuthData {
  configured: boolean;
  authType?: "role" | "access-keys";
  roleArn?: string | null;
  accessKeyId?: string | null;
  maskedSecretKey?: string | null;
}

interface AwsAuthFormProps {
  projectId: string;
  initialData: AwsAuthData;
}

export function AwsAuthForm({ projectId, initialData }: AwsAuthFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initialData.configured);
  const [authType, setAuthType] = useState<"role" | "access-keys">(
    initialData.authType ?? "role"
  );
  const [roleArn, setRoleArn] = useState(initialData.roleArn ?? "");
  const [accessKeyId, setAccessKeyId] = useState(initialData.accessKeyId ?? "");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const configured = initialData.configured;

  function handleEdit() {
    setEditing(true);
    setMessage(null);
    setAuthType(initialData.authType ?? "role");
    setRoleArn(initialData.roleArn ?? "");
    setAccessKeyId(initialData.accessKeyId ?? "");
    setSecretAccessKey("");
  }

  function handleCancelEdit() {
    setEditing(false);
    setMessage(null);
  }

  async function testConnection(): Promise<boolean> {
    setTesting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/aws-auth/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Connection test failed — credentials not saved" });
        return false;
      }
      return true;
    } catch {
      setMessage({ type: "error", text: "Connection test failed — credentials not saved" });
      return false;
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string | boolean> = { authType };
      if (authType === "role") {
        payload.roleArn = roleArn;
      } else {
        payload.accessKeyId = accessKeyId;
        payload.secretAccessKey = secretAccessKey;
      }
      if (configured) {
        payload._isUpdate = true;
      }

      const res = await fetch(`/api/projects/${projectId}/aws-auth`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      // Validate credentials via test connection before confirming success
      if (configured) {
        const testPassed = await testConnection();
        if (!testPassed) {
          // Credentials saved but test failed — inform user
          setMessage({ type: "error", text: "Credentials updated but connection test failed. Please verify your credentials." });
          router.refresh();
          setEditing(false);
          return;
        }
      }

      setMessage({ type: "success", text: configured ? "AWS credentials updated" : "AWS authentication saved" });
      setSecretAccessKey("");
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/aws-auth`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setMessage({ type: "success", text: "AWS credentials removed" });
      setRoleArn("");
      setAccessKeyId("");
      setSecretAccessKey("");
      setEditing(true);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/aws-auth/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Connection test failed");
      }
      setMessage({
        type: "success",
        text: `Connection successful — AWS Account: ${data.accountId}`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Connection test failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setTesting(false);
    }
  }

  // Read-only summary view when configured and not editing
  if (configured && !editing) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-green-600 font-medium">
          Configured — {initialData.authType === "role" ? "IAM Role" : "Access Keys"}
        </div>

        <div className="space-y-2 text-sm">
          {initialData.authType === "role" && initialData.roleArn && (
            <div>
              <span className="text-muted-foreground">Role ARN:</span>{" "}
              <span className="font-mono">{initialData.roleArn}</span>
            </div>
          )}
          {initialData.authType === "access-keys" && (
            <>
              {initialData.accessKeyId && (
                <div>
                  <span className="text-muted-foreground">Access Key ID:</span>{" "}
                  <span className="font-mono">{initialData.accessKeyId}</span>
                </div>
              )}
              {initialData.maskedSecretKey && (
                <div>
                  <span className="text-muted-foreground">Secret Key:</span>{" "}
                  <span className="font-mono">{initialData.maskedSecretKey}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleEdit} size="sm">
            Edit Credentials
          </Button>
          <Button onClick={handleTestConnection} disabled={testing} size="sm" variant="outline">
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={handleDelete} disabled={saving} size="sm" variant="destructive">
            Remove
          </Button>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    );
  }

  // Editable form view
  return (
    <div className="space-y-4">
      {configured && (
        <div className="text-sm text-muted-foreground">
          Updating credentials — running agents will use new credentials on next iteration.
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Authentication Method</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aws-auth-type"
              value="role"
              checked={authType === "role"}
              onChange={() => { setAuthType("role"); setMessage(null); }}
              className="accent-primary"
            />
            <span className="text-sm">IAM Role ARN</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aws-auth-type"
              value="access-keys"
              checked={authType === "access-keys"}
              onChange={() => { setAuthType("access-keys"); setMessage(null); }}
              className="accent-primary"
            />
            <span className="text-sm">Access Key Pair</span>
          </label>
        </div>
      </div>

      {authType === "role" && (
        <div>
          <Label htmlFor="role-arn" className="text-sm font-medium">
            IAM Role ARN
          </Label>
          <Input
            id="role-arn"
            value={roleArn}
            onChange={(e) => { setRoleArn(e.target.value); setMessage(null); }}
            placeholder="arn:aws:iam::123456789012:role/RalphRole"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: arn:aws:iam::&lt;account-id&gt;:role/&lt;role-name&gt;
          </p>
        </div>
      )}

      {authType === "access-keys" && (
        <>
          <div>
            <Label htmlFor="access-key-id" className="text-sm font-medium">
              Access Key ID
            </Label>
            <Input
              id="access-key-id"
              value={accessKeyId}
              onChange={(e) => { setAccessKeyId(e.target.value); setMessage(null); }}
              placeholder="AKIA..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="secret-access-key" className="text-sm font-medium">
              Secret Access Key
            </Label>
            <Input
              id="secret-access-key"
              type="password"
              value={secretAccessKey}
              onChange={(e) => { setSecretAccessKey(e.target.value); setMessage(null); }}
              placeholder={configured ? "Enter new secret key to replace" : "Enter secret access key"}
              className="mt-1"
            />
            {configured && initialData.maskedSecretKey && (
              <p className="text-xs text-muted-foreground mt-1">
                Current: {initialData.maskedSecretKey}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <a
          href="https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View least-privilege IAM role template
        </a>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || testing} size="sm">
          {saving || testing ? (testing ? "Validating..." : "Saving...") : configured ? "Update Credentials" : "Save Credentials"}
        </Button>
        {configured && (
          <Button onClick={handleCancelEdit} disabled={saving || testing} size="sm" variant="outline">
            Cancel
          </Button>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
