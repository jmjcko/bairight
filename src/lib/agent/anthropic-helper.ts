/**
 * Utility for parsing Anthropic API credentials.
 * Anthropic supports two kinds of keys:
 * 1. Standard Workspace-scoped keys: sk-ant-api03-... (does not need workspace ID)
 * 2. Organization / User-scoped keys: sk-ant-usr-... (requires anthropic-workspace-id header)
 * 
 * Users can input:
 * - "sk-ant-api03-..." (direct key)
 * - "sk-ant-usr-...:wrkspc_..." (key with workspace ID separated by colon or pipe)
 */

export interface ParsedAnthropicCredentials {
  apiKey: string;
  workspaceId?: string;
  isUserKey: boolean;
}

export function parseAnthropicKey(rawKey: string): ParsedAnthropicCredentials {
  const trimmed = (rawKey || '').trim();

  // Check for colon separator (e.g. "sk-ant-usr-...:wrkspc_...")
  if (trimmed.includes(':')) {
    const [k, ...rest] = trimmed.split(':');
    const cleanKey = k.trim();
    const cleanWorkspace = rest.join(':').trim() || undefined;
    return {
      apiKey: cleanKey,
      workspaceId: cleanWorkspace,
      isUserKey: cleanKey.startsWith('sk-ant-usr-'),
    };
  }

  // Check for pipe separator (e.g. "sk-ant-usr-...|wrkspc_...")
  if (trimmed.includes('|')) {
    const [k, ...rest] = trimmed.split('|');
    const cleanKey = k.trim();
    const cleanWorkspace = rest.join('|').trim() || undefined;
    return {
      apiKey: cleanKey,
      workspaceId: cleanWorkspace,
      isUserKey: cleanKey.startsWith('sk-ant-usr-'),
    };
  }

  return {
    apiKey: trimmed,
    workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || undefined,
    isUserKey: trimmed.startsWith('sk-ant-usr-'),
  };
}

export function buildAnthropicHeaders(
  credentials: ParsedAnthropicCredentials,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    'x-api-key': credentials.apiKey,
    'anthropic-version': '2023-06-01',
    ...(extraHeaders || {}),
  };

  if (credentials.workspaceId) {
    headers['anthropic-workspace-id'] = credentials.workspaceId;
  }

  return headers;
}
