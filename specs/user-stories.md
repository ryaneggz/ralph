# User Stories — LinkedIn Cron Scheduler

## US-001: Create cron entry script

**As a** content manager, **I want** a shell script that invokes the linkedin-scheduler agent **so that** it can be triggered by cron nightly.

### Acceptance Criteria
- Script at `scripts/linkedin-cron.sh` is executable
- Script reads config from `config/linkedin-cron.json`
- Script invokes Claude CLI with linkedin-scheduler agent prompt
- Script passes account, topic, and scheduling parameters
- Script logs output to `logs/linkedin-cron-YYYY-MM-DD.log`
- Script exits 0 on success, non-zero on failure
- Script is idempotent (safe to run twice)

## US-002: Create cron configuration

**As a** developer, **I want** a cron configuration and config file **so that** the script runs at 6pm MST nightly.

### Acceptance Criteria
- `config/linkedin-cron.json` defines accounts, schedule time, default topics
- `scripts/crontab.example` has correct cron expression for 6pm MST
- README or docs explain how to install the crontab entry
- Timezone handling accounts for DST (America/Denver)

## US-003: Add error handling and logging

**As a** developer, **I want** robust error handling **so that** failures are visible and recoverable.

### Acceptance Criteria
- Script checks for `POST_BRIDGE_API_KEY` before running
- Script checks for `claude` CLI availability
- Failed runs are logged with error details
- Optional: notification on failure (e.g., log to stderr for cron email)

## US-004: Document setup and learnings

**As a** developer, **I want** comprehensive documentation **so that** future cron automations can be set up quickly.

### Acceptance Criteria
- `docs/linkedin-cron-setup.md` covers: prerequisites, installation, configuration, troubleshooting
- All learnings from first-time setup captured
- Progress.txt updated with patterns and gotchas

## US-005: Push all changes for review

**As a** reviewer, **I want** all changes pushed to the feature branch **so that** I can review them in the PR.

### Acceptance Criteria
- All files committed with descriptive messages
- Branch pushed to origin
- Draft PR updated with summary of changes
