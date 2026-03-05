# Plan: Create `/linkedin` Slash Command

## Context

The `linkedin-scheduler` agent (`.claude/agents/linkedin-scheduler.md`) already exists and handles the full workflow: generate voice-matched posts via the `linkedin-tonality-post` skill, then publish/schedule via Post Bridge API.

Currently there's no slash command to invoke it efficiently. Following the pattern established by `/ticket` (which orchestrates the `team` command and git worktrees), we need a `/linkedin` command that provides a structured entry point to the agent.

## File to Create

### `.claude/commands/linkedin.md`

A single command file following the established Orchestra command pattern (see `ticket.md`, `team.md`).

**Pattern reference**: `.claude/commands/ticket.md` — uses `_ACTION_` verbs, `$ARGUMENTS` variables, structured workflow, error handling, and report section.

### Variables

```markdown
ACCOUNT: $ARGUMENTS.account (required: ryan|ruska|prompteng)
TOPIC: $ARGUMENTS.topic (required: post subject)
MODE: $ARGUMENTS.mode (default: "now" — options: now|at|queue|draft)
SCHEDULE_AT: $ARGUMENTS.at (optional: ISO 8601 datetime, used when mode=at)
MEDIA: $ARGUMENTS.media (optional: URL or local file path)
LENGTH: $ARGUMENTS.length (optional: short|medium|long)
CTA: $ARGUMENTS.cta (optional: yes|no)
BULLETS: $ARGUMENTS.bullets (optional: yes)
```

### Workflow Steps

1. **_VALIDATE_** required inputs (account, topic) — prompt if missing
2. **_DETERMINE_** scheduling mode from MODE/SCHEDULE_AT
3. **_INVOKE_** linkedin-scheduler agent with composed parameters — the agent handles:
   - Corpus loading + tonality extraction + post drafting
   - User confirmation of draft
   - Post Bridge account resolution + API publishing
4. **_REPORT_** final status (post URL, scheduled time, or draft ID)

### Error Handling

- Missing account → list available accounts
- Missing topic → ask what the post is about
- Missing `POST_BRIDGE_API_KEY` → warn and stop
- Invalid account slug → show valid options

### Example Invocations

```
/linkedin account=ryan topic="AI dev tools" mode=now
/linkedin account=ruska topic="new feature" mode=at at=2026-03-10T14:00:00Z
/linkedin account=prompteng topic="beginner tips" mode=queue
/linkedin account=ryan topic="shipping fast" mode=draft length=short
```

## Implementation

1. Create `.claude/commands/linkedin.md` (~60 lines)

## Verification

1. `/linkedin account=ryan topic="AI dev tools" mode=now` — should invoke agent, generate Ryan voice post, confirm, publish
2. `/linkedin account=ruska topic="new feature"` — should default to mode=now
3. `/linkedin` with no args — should prompt for account and topic
4. `/linkedin account=invalid topic="test"` — should show valid account options
