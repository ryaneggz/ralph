/**
 * Extensible subagent provider registry.
 *
 * To add a new provider:
 * 1. Add an entry to PROVIDER_REGISTRY below
 * 2. The platform discovers new providers on restart
 * 3. New providers automatically appear in provider selection dropdowns and settings
 */

export interface ProviderDefinition {
  /** Unique provider identifier (used in DB, API, etc.) */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Agent endpoint URL (used for sending emails / messages) */
  endpointUrl: string;
  /** Authentication scheme the provider expects */
  authScheme: "api-key" | "bearer" | "oauth2" | "none";
  /** Prefix expected for API keys (used for basic format validation) */
  keyPrefix?: string;
  /** Placeholder text for the API key input field */
  keyPlaceholder?: string;
}

/**
 * Central provider registry. Add new providers here.
 */
export const PROVIDER_REGISTRY: readonly ProviderDefinition[] = [
  {
    id: "claude-code",
    name: "Claude Code (Anthropic)",
    endpointUrl: "https://api.anthropic.com",
    authScheme: "api-key",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "codeex",
    name: "Codeex",
    endpointUrl: "https://api.codeex.dev",
    authScheme: "api-key",
    keyPrefix: "codeex-",
    keyPlaceholder: "codeex-...",
  },
  {
    id: "opencode",
    name: "OpenCode",
    endpointUrl: "https://api.opencode.dev",
    authScheme: "api-key",
    keyPrefix: "opencode-",
    keyPlaceholder: "opencode-...",
  },
] as const;

/** All valid provider IDs derived from the registry */
export const PROVIDER_IDS = PROVIDER_REGISTRY.map((p) => p.id);

/** Lookup a provider definition by ID */
export function getProvider(id: string): ProviderDefinition | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === id);
}

/** Check if a provider ID is valid */
export function isValidProvider(id: string): boolean {
  return PROVIDER_IDS.includes(id);
}

/** Get display options for dropdowns (id + label) */
export function getProviderOptions(): { key: string; label: string }[] {
  return PROVIDER_REGISTRY.map((p) => ({ key: p.id, label: p.name }));
}

/**
 * Validate an API key format for a given provider.
 * Returns an error message if invalid, or null if valid / no validation rule.
 */
export function validateKeyFormat(
  providerId: string,
  key: string
): string | null {
  const provider = getProvider(providerId);
  if (!provider || !provider.keyPrefix) return null;
  if (!key.startsWith(provider.keyPrefix)) {
    return `Invalid key format. ${provider.name} keys start with ${provider.keyPrefix}`;
  }
  return null;
}
