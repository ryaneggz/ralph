#!/usr/bin/env bash

# Loads env vars from .claude/.env.claude
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$DIR")"
ENV_FILE="$ROOT/.env.claude"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo "SLACK_WEBHOOK_URL is not set" >&2
  exit 1
fi

# Reads all of stdin as one string
payload="$(cat)"

# Extracts a field from the input JSON
json_get() {
  echo "$payload" | jq -r "$1"
}

event="$(json_get '.hook_event_name' 2>/dev/null || echo "")"
cwd="$(json_get '.cwd' 2>/dev/null || echo "")"
session_id="$(json_get '.session_id' 2>/dev/null || echo "")"
timestamp="$(date '+%Y-%m-%d %H:%M:%S')"

get_final_response() {
  local path="$1"
  local max_length=1500
  local result=""
  if [[ -z "$path" || ! -f "$path" ]]; then
    echo "(transcript not found)"
    return
  fi
  # Reverse the file to get the last relevant entry
  # Find the latest assistant message, extract the text, merge paragraphs
  result="$(tac "$path" | \
    jq -Rc '
      try fromjson catch empty
    ' | awk '
      $0 ~ /"type":"assistant"/ && $0 ~ /"role":"assistant"/ { print }
    ' | head -1 | \
      jq -r '
        .message.content // []
        | map(
            if type=="object" and .type=="text" then .text
            elif type=="string" then .
            else empty
            end
          ) | join("\n")
      ' 2>/dev/null)"
  if [[ -z "$result" ]]; then
    echo "(no response found)"
    return
  fi
  local len=${#result}
  if (( len > max_length )); then
    echo "${result:0:$max_length}..."
    echo "_(truncated)_"
  else
    echo "$result"
  fi
}

# Compose notification message
text=""
if [[ "$event" == "Notification" ]]; then
  nt="$(json_get '.notification_type' 2>/dev/null || echo "")"
  msg="$(json_get '.message' 2>/dev/null || echo "")"
  text="🧠 Claude Code: *${nt}*
${msg}
• time: \`${timestamp}\`
• cwd: \`${cwd}\`
• session: \`${session_id}\`"
elif [[ "$event" == "Stop" ]]; then
  active="$(json_get '.stop_hook_active' 2>/dev/null || echo "")"
  transcript_path="$(json_get '.transcript_path' 2>/dev/null || echo "")"
  final_response="$(get_final_response "$transcript_path")"
  text="✅ Claude Code: *Stop*
• time: \`${timestamp}\`
• cwd: \`${cwd}\`
• session: \`${session_id}\`
• stop_hook_active: \`${active}\`

*Final Response:*
\`\`\`
${final_response}
\`\`\`
"
else
  text="Claude Code hook: ${event}
• time: \`${timestamp}\`
• cwd: ${cwd}
• session: ${session_id}"
fi

# Send to Slack
resp_code=$(curl -X POST -s -o /dev/null -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -d "{\"text\": $(jq -Rs <<<"$text")}" \
  "$SLACK_WEBHOOK_URL"
)
if [[ "$resp_code" -lt 200 || "$resp_code" -ge 300 ]]; then
  echo "Failed to send Slack notification (HTTP $resp_code)" >&2
  exit 1
fi
