#!/usr/bin/env bash
# linkedin-cron.sh — Nightly LinkedIn content scheduler
# Invokes the linkedin-scheduler agent via Claude CLI to generate and schedule
# LinkedIn posts for the following day.
#
# Usage: ./scripts/linkedin-cron.sh [--config path/to/config.json] [--dry-run]

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/linkedin-cron.json"
LOG_DIR="$PROJECT_ROOT/logs"
DRY_RUN=false
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/linkedin-cron-${TODAY}.log"
LOCK_FILE="/tmp/linkedin-cron.lock"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case $1 in
    --config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --config=*)
      CONFIG_FILE="${1#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
mkdir -p "$LOG_DIR"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
}

log_error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg" >&2
}

# ---------------------------------------------------------------------------
# Idempotency lock (prevents duplicate runs on the same day)
# ---------------------------------------------------------------------------
acquire_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local lock_date
    lock_date=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [[ "$lock_date" == "$TODAY" ]]; then
      log "Already ran successfully today ($TODAY). Skipping (idempotent)."
      exit 0
    fi
  fi
}

release_lock() {
  echo "$TODAY" > "$LOCK_FILE"
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  if [[ -z "${POST_BRIDGE_API_KEY:-}" ]]; then
    log_error "POST_BRIDGE_API_KEY is not set. Export it before running."
    exit 1
  fi

  if ! command -v claude &>/dev/null; then
    log_error "claude CLI not found in PATH. Install Claude Code first."
    exit 1
  fi

  if ! command -v jq &>/dev/null; then
    log_error "jq not found in PATH. Install jq first."
    exit 1
  fi

  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_error "Config file not found: $CONFIG_FILE"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Compute next-day schedule time in ISO 8601 for a given account
# ---------------------------------------------------------------------------
compute_schedule_time() {
  local hour="$1"
  local minute="$2"
  local tz="$3"

  # Schedule for tomorrow (in the target timezone)
  local tomorrow
  tomorrow=$(TZ="$tz" date -d "tomorrow" +%Y-%m-%d 2>/dev/null || TZ="$tz" date -v+1d +%Y-%m-%d)
  # Convert local time to UTC ISO 8601
  # GNU date: TZ="..." inside -d string sets the input timezone
  local local_dt="${tomorrow} $(printf '%02d:%02d:00' "$hour" "$minute")"
  local utc_dt
  utc_dt=$(date -d "TZ=\"$tz\" $local_dt" -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
           TZ="$tz" date -j -f "%Y-%m-%d %H:%M:%S" "$local_dt" -u +%Y-%m-%dT%H:%M:%SZ)
  echo "$utc_dt"
}

# ---------------------------------------------------------------------------
# Process a single account
# ---------------------------------------------------------------------------
process_account() {
  local slug="$1"
  local name="$2"
  local scheduling_mode="$3"
  local hour="$4"
  local minute="$5"
  local tz="$6"
  local topic_strategy="$7"

  log "Processing account: $name ($slug)"

  # Build the schedule parameter
  local schedule_param=""
  if [[ "$scheduling_mode" == "at" ]]; then
    local schedule_time
    schedule_time=$(compute_schedule_time "$hour" "$minute" "$tz")
    schedule_param="at=${schedule_time}"
    log "  Scheduled for: $schedule_time"
  else
    schedule_param="$scheduling_mode"
  fi

  # Build the Claude CLI prompt
  local prompt="Schedule a linkedin post account=${slug} topic='${topic_strategy}' ${schedule_param}"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "  [DRY RUN] Would invoke: claude --agent linkedin-scheduler -p \"$prompt\""
    return 0
  fi

  # Invoke the linkedin-scheduler agent via Claude CLI
  log "  Invoking linkedin-scheduler agent..."
  local output
  local exit_code=0
  output=$(claude --dangerously-skip-permissions --agent linkedin-scheduler -p "$prompt" 2>&1) || exit_code=$?

  # Log the output
  echo "$output" >> "$LOG_FILE"

  if [[ $exit_code -ne 0 ]]; then
    log_error "linkedin-scheduler failed for $slug (exit code: $exit_code)"
    return 1
  fi

  log "  Successfully scheduled content for $name"
  return 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  log "=== LinkedIn Cron Scheduler started ==="
  log "Config: $CONFIG_FILE"
  log "Date: $TODAY"

  acquire_lock
  check_prerequisites

  # Read config
  local accounts
  accounts=$(jq -c '.accounts[] | select(.enabled == true)' "$CONFIG_FILE")
  local topic_strategy
  topic_strategy=$(jq -r '.contentParameters.topicStrategy' "$CONFIG_FILE")

  if [[ -z "$accounts" ]]; then
    log "No enabled accounts found in config. Nothing to do."
    release_lock
    exit 0
  fi

  local failed=0
  local processed=0

  while IFS= read -r account; do
    local slug name scheduling_mode hour minute tz
    slug=$(echo "$account" | jq -r '.slug')
    name=$(echo "$account" | jq -r '.name')
    scheduling_mode=$(echo "$account" | jq -r '.schedulingMode')
    hour=$(echo "$account" | jq -r '.defaultScheduleHour')
    minute=$(echo "$account" | jq -r '.defaultScheduleMinute')
    tz=$(echo "$account" | jq -r '.timezone')

    if process_account "$slug" "$name" "$scheduling_mode" "$hour" "$minute" "$tz" "$topic_strategy"; then
      processed=$((processed + 1))
    else
      failed=$((failed + 1))
    fi
  done <<< "$accounts"

  log "=== Completed: $processed succeeded, $failed failed ==="

  if [[ $failed -gt 0 ]]; then
    log_error "$failed account(s) failed. Check log: $LOG_FILE"
    exit 1
  fi

  release_lock
  log "=== LinkedIn Cron Scheduler finished successfully ==="
  exit 0
}

main "$@"
