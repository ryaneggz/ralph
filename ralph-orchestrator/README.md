# Ralph Orchestrator — Platform App

This directory contains the Next.js web application for Ralph Orchestrator.

## Overview

Ralph Orchestrator is "Gmail for AI agents" — a web platform where developers compose tasks as emails, each triggering an autonomous Ralph loop on AWS infrastructure. Users bring their own LLM API keys and AWS credentials. Agents auto-scale to zero when idle.

See the full [PRD](../PRD.md) and [ICP](../ICP.md) for detailed requirements and target customer profile.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui components
- **Database**: MongoDB Atlas
- **Auth**: NextAuth.js (email/password + GitHub OAuth)
- **Infra**: AWS (ECS Fargate, Lambda, SQS, Secrets Manager)
- **IaC**: Pulumi (TypeScript)
- **PWA**: Serwist service worker, Web Push API

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, signup, password reset
│   ├── (dashboard)/          # Inbox, chat, settings
│   │   ├── inbox/            # Primary orchestration UI
│   │   ├── chat/             # Real-time agent monitoring
│   │   └── settings/         # Keys, AWS, IaC, templates
│   ├── api/v1/               # REST + WebSocket API
│   └── manifest.ts           # PWA manifest
├── components/
│   ├── inbox/                # Inbox layout, task list, compose modal
│   ├── composer/             # PROMPT.md editor, templates, variables
│   ├── chat/                 # Streaming output, file tree, actions
│   ├── iac/                  # Monaco editor, version history
│   └── ui/                   # shadcn/ui components
├── lib/                      # API client, WebSocket, auth, DB, hooks
└── workers/                  # Service worker (Serwist)
```

## User Stories

All 48 user stories are tracked in [`prd.json`](prd.json) for autonomous Ralph execution. Categories:

1. **Authentication & Account** (US-01 to US-03)
2. **Projects** (US-04 to US-07)
3. **Provider Keys** (US-08 to US-14)
4. **AWS Configuration** (US-15 to US-18)
5. **IaC Templates & Drafts** (US-19 to US-24)
6. **PROMPT.md Editor** (US-25 to US-28)
7. **Runs (Plan/Apply/Destroy)** (US-29 to US-35)
8. **Email-Driven Workflow** (US-36 to US-39)
9. **Agents (Sessions & Spin-down)** (US-40 to US-43)
10. **Audit & Safety** (US-44 to US-45)
11. **Subagent API (deepagentsjs)** (US-46 to US-48)

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run test
```

All commits must pass these checks. Ralph iterations enforce this automatically.
