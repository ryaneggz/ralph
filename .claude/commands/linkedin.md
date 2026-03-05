# LinkedIn

Create and publish voice-matched LinkedIn posts via the linkedin-scheduler agent.

## Variables

ACCOUNT: $ARGUMENTS.account (required: ryan|ruska|prompteng)
TOPIC: $ARGUMENTS.topic (required: post subject)
MODE: $ARGUMENTS.mode (default: "now" — options: now|at|queue|draft)
SCHEDULE_AT: $ARGUMENTS.at (optional: ISO 8601 datetime, used when mode=at)
MEDIA: $ARGUMENTS.media (optional: URL or local file path)
LENGTH: $ARGUMENTS.length (optional: short|medium|long)
CTA: $ARGUMENTS.cta (optional: yes|no)
BULLETS: $ARGUMENTS.bullets (optional: yes)

## Workflow

1. _VALIDATE_ required inputs:
    - IF ACCOUNT is missing or empty: _PROMPT_ with available accounts:
      > Which LinkedIn account should I post to?
      > - `ryan` — Ryan Eggleston (personal)
      > - `ruska` — Ruska AI (brand)
      > - `prompteng` — Prompt Engineers AI (brand)
    - IF ACCOUNT is not one of `ryan`, `ruska`, `prompteng`: _REPORT_ "Invalid account '$ACCOUNT'. Valid options: ryan, ruska, prompteng" and stop
    - IF TOPIC is missing or empty: _PROMPT_ "What should the post be about?"

2. _DETERMINE_ scheduling mode:
    - IF MODE is not provided: default to `now`
    - IF MODE is `at` and SCHEDULE_AT is missing: _PROMPT_ "When should this be scheduled? (ISO 8601 format, e.g. 2026-03-10T14:00:00Z)"
    - IF MODE is not one of `now`, `at`, `queue`, `draft`: _REPORT_ "Invalid mode '$MODE'. Valid options: now, at, queue, draft" and stop

3. _INVOKE_ the `linkedin-scheduler` agent with composed parameters:
    - Pass account, topic, scheduling mode, and any optional style knobs (media, length, cta, bullets)
    - The agent handles the full workflow:
      - Corpus loading + tonality extraction + post drafting
      - User confirmation of draft
      - Post Bridge account resolution + API publishing
      - Post verification and result reporting

4. _REPORT_ final status from the agent:
    - Post URL (if published immediately)
    - Scheduled time (if mode=at)
    - Queue confirmation (if mode=queue)
    - Draft ID (if mode=draft)

## Error Handling

- **Missing account** — list available accounts (ryan, ruska, prompteng)
- **Missing topic** — ask what the post should be about
- **Invalid account slug** — show valid options and stop
- **Invalid mode** — show valid options and stop
- **Missing `POST_BRIDGE_API_KEY`** — warn: "POST_BRIDGE_API_KEY is not set. Set it before publishing." and stop
- **Agent failure** — surface the error and suggest retrying

## Example Invocations

```bash
# Publish immediately to Ryan's account
/linkedin account=ryan topic="AI dev tools" mode=now

# Schedule for a specific time
/linkedin account=ruska topic="new feature" mode=at at=2026-03-10T14:00:00Z

# Add to auto-queue
/linkedin account=prompteng topic="beginner tips" mode=queue

# Save as draft with style options
/linkedin account=ryan topic="shipping fast" mode=draft length=short

# With media attachment
/linkedin account=ruska topic="product demo" mode=now media=https://example.com/demo.png

# Defaults to mode=now when mode is omitted
/linkedin account=ruska topic="new feature"
```

## Report

Confirm workflow completion with:

- Account used and post topic
- Scheduling mode applied
- Post status (published / scheduled / queued / drafted)
- Post URL or ID from Post Bridge
- Any media attached
