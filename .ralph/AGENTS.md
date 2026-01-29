# Ralph — Agent Instructions

## Overview

Ralph is a web platform for provisioning and interacting with autonomous AI coding agents (Ralph loops) on AWS. The primary UI is a Gmail-style inbox where each "email" triggers a Ralph loop. Users bring their own API keys and AWS credentials.

## Commands

```bash
# Run Ralph loop with Claude Code
./ralph.sh --tool claude [max_iterations]

# Run Ralph loop with Amp (default)
./ralph.sh [max_iterations]

# Develop the platform app
cd ralph && npm install && npm run dev

# Quality checks (within ralph/)
npm run typecheck
npm run lint
npm run test
```

## Key Files

-   `ralph.sh` — Ralph loop shell script (supports `--tool amp` or `--tool claude`)
-   `prompt.md` — Amp agent instructions
-   `CLAUDE.md` — Claude Code agent instructions
-   `PRD.md` — Full product requirements document (48 user stories)
-   `ICP.md` — Ideal Customer Profile
-   `ralph/` — Next.js platform app source code
-   `ralph/prd.json` — User stories for autonomous execution
-   `prd.json.example` — Example PRD format reference

## Architecture

-   **Frontend**: Next.js 14+ App Router, TypeScript strict, shadcn/ui
-   **Database**: MongoDB Atlas
-   **Auth**: NextAuth.js (email/password + GitHub OAuth)
-   **Queue**: AWS SQS FIFO for task ordering
-   **Agent Runtime**: ECS Fargate (auto-scale to zero)
-   **Secrets**: AWS Secrets Manager for encrypted API key storage
-   **IaC**: Pulumi TypeScript templates
-   **Real-time**: WebSocket for streaming Ralph iteration output
-   **PWA**: Serwist service worker, Web Push notifications

## Patterns

-   Each Ralph iteration spawns a fresh AI instance with clean context
-   Memory persists via git history, `progress.txt`, and `prd.json`
-   Stories should be small enough to complete in one context window
-   Always update AGENTS.md with discovered patterns for future iterations
-   The Agent Inbox IS the orchestration layer — no separate dashboard
-   All user secrets stored in AWS Secrets Manager, never exposed in UI
-   Projects scope all downstream features (keys, IaC, runs, agents)
-   Run types: Plan (preview), Apply (execute), Destroy (tear down)
-   Email-driven workflow: PROMPT.md → email → Ralph loop → inbound responses as logs
