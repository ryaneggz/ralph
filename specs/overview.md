# LinkedIn Cron Scheduler — Feature Spec

## Goal

Create a nightly cron job that runs at 6pm MST (America/Denver) to schedule LinkedIn content for the following day using the existing `linkedin-scheduler` agent.

## Context

- **Issue**: #5
- **Branch**: `feat/5-linkedin-cron`
- **First-time setup** — all learnings must be documented

## Architecture

The cron job will be implemented as a script + cron configuration that:

1. **Triggers** at 6pm MST daily (equivalent to 01:00 UTC next day, or shifts with DST)
2. **Invokes** the linkedin-scheduler agent via Claude CLI
3. **Generates** voice-matched LinkedIn content for one or more accounts
4. **Schedules** the post via Post Bridge API for the following day
5. **Logs** results (success/failure) to a log file

## Components

### 1. Cron Entry Script (`scripts/linkedin-cron.sh`)
- Shell script that orchestrates the nightly run
- Sets up environment (API keys, paths)
- Invokes Claude CLI with the linkedin-scheduler agent
- Captures output and logs results
- Handles errors gracefully

### 2. Cron Configuration (`scripts/crontab.example`)
- Example crontab entry for 6pm MST
- Instructions for installation

### 3. Configuration (`config/linkedin-cron.json`)
- Which accounts to post for (ryan, ruska, prompteng)
- Default scheduling time for next-day posts
- Topic sources or content strategy notes

### 4. Documentation (`docs/linkedin-cron-setup.md`)
- Setup instructions
- Environment requirements
- Troubleshooting guide
- Learnings captured during development

## Constraints

- Must use existing `linkedin-scheduler` agent (`.claude/agents/linkedin-scheduler.md`)
- Must use Post Bridge API via `POST_BRIDGE_API_KEY`
- Posts should be scheduled (not published immediately) for the following day
- Script must be idempotent — safe if cron fires twice
- No new external dependencies beyond Claude CLI + curl/jq
