# LinkedIn Cron Scheduler Setup

Nightly cron job that schedules LinkedIn content for the following day using the `linkedin-scheduler` Claude Code agent.

## Prerequisites

| Requirement | Notes |
|---|---|
| **Claude Code CLI** | `claude` must be in PATH. Install from [claude.ai](https://claude.ai/claude-code). |
| **jq** | Used to parse `config/linkedin-cron.json`. Install via `apt install jq` or `brew install jq`. |
| **POST_BRIDGE_API_KEY** | Environment variable. Required for the `linkedin-scheduler` agent to publish posts via Post Bridge. |
| **linkedin-scheduler agent** | Must be configured in your Claude Code agents (`.claude/agents/`). |
| **Bash 4+** | Script uses `set -euo pipefail` and associative features. macOS ships Bash 3 — use `brew install bash` if needed. |

## Installation

### 1. Clone and navigate to the project

```bash
git clone <repo-url> && cd ralph
```

### 2. Set environment variables

```bash
export POST_BRIDGE_API_KEY="your-api-key-here"
```

For cron, add the export to your crontab or a sourced env file (see Cron Environment section below).

### 3. Make the script executable

```bash
chmod +x scripts/linkedin-cron.sh
```

### 4. Verify prerequisites

```bash
# Dry run — validates config, checks prerequisites, but does not invoke Claude
./scripts/linkedin-cron.sh --dry-run
```

### 5. Install the cron job

```bash
# Edit your crontab
crontab -e

# Add the entry (adjust paths):
CRON_TZ=America/Denver
0 18 * * * /absolute/path/to/scripts/linkedin-cron.sh >> /absolute/path/to/logs/linkedin-cron-crontab.log 2>&1
```

See `scripts/crontab.example` for alternative scheduling options.

## Configuration

All configuration lives in `config/linkedin-cron.json`.

### Accounts

Each account object controls one LinkedIn profile:

```json
{
  "slug": "ryan",
  "name": "Ryan Eggleston",
  "enabled": true,
  "schedulingMode": "at",
  "defaultScheduleHour": 9,
  "defaultScheduleMinute": 0,
  "timezone": "America/Denver"
}
```

| Field | Description |
|---|---|
| `slug` | Account identifier passed to the linkedin-scheduler agent. |
| `name` | Display name for logging. |
| `enabled` | Set `false` to skip this account without removing it. |
| `schedulingMode` | `"at"` schedules for a specific time; other values are passed directly. |
| `defaultScheduleHour` / `defaultScheduleMinute` | Local time (in `timezone`) to publish the post the next day. |
| `timezone` | IANA timezone (e.g., `America/Denver`). Used for DST-aware time conversion. |

### Content Parameters

```json
{
  "contentParameters": {
    "topicStrategy": "Generate a trending, relevant LinkedIn post topic...",
    "contentType": "text",
    "platform": "linkedin"
  }
}
```

The `topicStrategy` string is passed to the linkedin-scheduler agent as the topic prompt.

### Cron Schedule

The `cronSchedule` section is informational — it documents the intended schedule for human reference. The actual schedule is set in your crontab.

## CLI Usage

```bash
# Normal run (processes all enabled accounts)
./scripts/linkedin-cron.sh

# Custom config file
./scripts/linkedin-cron.sh --config /path/to/custom-config.json

# Dry run (validate without invoking Claude)
./scripts/linkedin-cron.sh --dry-run
```

## How It Works

1. **Idempotency check** — A lock file (`/tmp/linkedin-cron.lock`) stores the last successful run date. If already run today, the script exits 0 silently.
2. **Prerequisite validation** — Checks `POST_BRIDGE_API_KEY`, `claude` CLI, `jq`, config file existence, and JSON structure.
3. **Account loop** — For each enabled account, computes tomorrow's publish time in UTC (ISO 8601) and invokes the `linkedin-scheduler` agent via Claude CLI.
4. **Logging** — All output goes to `logs/linkedin-cron-YYYY-MM-DD.log`. Errors also go to stderr (which cron emails by default).
5. **Lock release** — On full success, the lock file is updated so reruns on the same day are skipped.

## Cron Environment

Cron runs with a minimal environment. Ensure these are available:

```bash
# Option A: Set in crontab directly
POST_BRIDGE_API_KEY=your-key
PATH=/usr/local/bin:/usr/bin:/bin:/home/user/.local/bin

# Option B: Source an env file in the crontab
* * * * * . /home/user/.env.linkedin-cron && /path/to/scripts/linkedin-cron.sh
```

## DST Handling

The script handles Daylight Saving Time in two layers:

1. **Cron trigger** — Use `CRON_TZ=America/Denver` so cron fires at 6pm local time regardless of DST. If your cron doesn't support `CRON_TZ`, use the dual-UTC-entry fallback in `scripts/crontab.example`.
2. **Post scheduling** — The script uses GNU `date -d 'TZ="Zone" datetime'` to convert local publish times to UTC, which correctly handles DST offsets.

## Troubleshooting

### Script exits immediately with "Already ran successfully today"

The idempotency lock is working. To force a rerun:

```bash
rm /tmp/linkedin-cron.lock
./scripts/linkedin-cron.sh
```

### "POST_BRIDGE_API_KEY is not set"

Export the variable before running, or add it to your cron environment (see Cron Environment above).

### "claude CLI not found in PATH"

Ensure Claude Code is installed and `claude` is in the PATH used by cron. Common fix:

```bash
# In crontab, prepend the path:
PATH=/home/user/.local/bin:/usr/local/bin:/usr/bin:/bin
```

### "Config file missing required 'accounts' field"

Your `config/linkedin-cron.json` is malformed. Validate with:

```bash
jq . config/linkedin-cron.json
```

Ensure it has both `accounts` and `contentParameters` top-level keys.

### Posts not appearing on LinkedIn

1. Check the log file: `logs/linkedin-cron-YYYY-MM-DD.log`
2. Look for agent output between `--- claude output for <slug> ---` delimiters
3. Verify the Post Bridge API key is valid and the account slug matches your Post Bridge configuration

### macOS date compatibility

The script supports both GNU and BSD date. If you get date parsing errors on macOS, install GNU coreutils:

```bash
brew install coreutils
# GNU date is available as 'gdate', or add to PATH:
export PATH="/opt/homebrew/opt/coreutils/libexec/gnubin:$PATH"
```

## File Structure

```
scripts/
  linkedin-cron.sh       # Main entry script
  crontab.example        # Example crontab configurations
config/
  linkedin-cron.json     # Account and scheduling configuration
logs/
  linkedin-cron-*.log    # Daily log files (gitignored)
  .gitkeep               # Keeps the logs directory in git
docs/
  linkedin-cron-setup.md # This file
```
