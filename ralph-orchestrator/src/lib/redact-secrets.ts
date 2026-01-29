/**
 * Redacts known secret patterns from text.
 * Applied to log lines before storage and before display.
 */

const SECRET_PATTERNS: RegExp[] = [
  // AWS Access Key IDs (AKIA...)
  /\b(AKIA[0-9A-Z]{16})\b/g,
  // AWS Secret Access Keys (40-char base64)
  /\b([A-Za-z0-9/+=]{40})\b(?=.*(?:aws|secret|key))/gi,
  // AWS Session Tokens
  /\b(FwoGZXIvYXdzE[A-Za-z0-9/+=]+)\b/g,
  // Anthropic API keys (sk-ant-...)
  /\b(sk-ant-[A-Za-z0-9_-]{20,})\b/g,
  // OpenAI API keys (sk-...)
  /\b(sk-[A-Za-z0-9]{20,})\b/g,
  // Generic API key patterns (key=... or key:...)
  /(?<=(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|secret)\s*[:=]\s*["']?)([A-Za-z0-9_\-./+=]{8,})(?=["']?\s|["']?$)/gi,
  // Bearer tokens
  /(?<=Bearer\s+)([A-Za-z0-9_\-./+=]{20,})/gi,
  // Codeex keys
  /\b(codeex-[A-Za-z0-9_-]{8,})\b/g,
  // OpenCode keys
  /\b(opencode-[A-Za-z0-9_-]{8,})\b/g,
  // GitHub tokens (ghp_, gho_, ghs_, ghr_)
  /\b(gh[pors]_[A-Za-z0-9_]{16,})\b/g,
  // Generic long hex/base64 strings that look like secrets (32+ chars following key-like words)
  /(?<=(?:token|secret|credential|password|apikey)\s*[:=]\s*["']?)([A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{32,}={0,2})(?=["']?\s|["']?$)/gi,
];

const REDACTED = "[REDACTED]";

/**
 * Redact secrets from a single string.
 */
export function redactSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    // Reset lastIndex for global regexps
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  return result;
}

/**
 * Redact secrets from an array of log lines.
 */
export function redactLogLines(lines: string[]): string[] {
  return lines.map(redactSecrets);
}
