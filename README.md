# Ralph Orchestrator 🤖

A web-based platform for provisioning and interacting with **Ralph agents** (autonomous iteration loops) running on AWS infrastructure. Users compose tasks via a Gmail-style inbox interface where each "email" becomes a `PROMPT.md` that kicks off a Ralph loop. Users provide their own API keys (stored encrypted), can edit IaC before deployment, and agents auto-scale to zero when idle.

**Core Concept**: The Agent Inbox IS the orchestration layer. Each inbox item = one Ralph loop execution. No separate orchestration UI needed.

## What is Ralph?

Ralph is an autonomous iteration framework (based on [Geoffrey Huntley's pattern](https://ghuntley.com/ralph/)) that:
- Takes a `PROMPT.md` as input (the task specification)
- Runs iterative loops until task completion or max iterations
- Uses Claude Code, Codeex, or OpenCode as the underlying LLM
- Outputs artifacts, logs, and status updates

This repository contains both the **Ralph loop tooling** (shell scripts, prompt templates, skills) and the **Ralph Orchestrator platform** (Next.js web app in `ralph-orchestrator/`).

## Repository Structure

```
ralph-orchestrator/
├── .claude/                    # Claude Code config (skills, hooks, templates)
│   ├── skills/prd/             # Skill for generating PRDs
│   ├── skills/ralph/           # Skill for converting PRDs to JSON
│   ├── hooks/                  # Automation hooks
│   └── templates/              # Task templates
├── .github/workflows/          # CI/CD
├── ralph-orchestrator/         # Next.js platform app (the product)
│   ├── prd.json                # User stories for Ralph autonomous execution
│   └── ...                     # App source code (scaffolded here)
├── PRD.md                      # Full Product Requirements Document
├── ICP.md                      # Ideal Customer Profile
├── CLAUDE.md                   # Claude Code agent instructions
├── AGENTS.md                   # Agent patterns and context
├── prompt.md                   # Amp agent instructions
├── ralph.sh                    # Ralph loop shell script
├── prd.json.example            # Example PRD format
└── LICENSE
```

## Quick Start

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`) or [Amp CLI](https://ampcode.com)
- `jq` installed (`brew install jq` on macOS)
- Node.js 18+
- A git repository

### Running Ralph Loops

```bash
# Using Claude Code
./ralph.sh --tool claude [max_iterations]

# Using Amp (default)
./ralph.sh [max_iterations]
```

Default is 10 iterations. Ralph will:
1. Create a feature branch (from PRD `branchName`)
2. Pick the highest priority story where `passes: false`
3. Implement that single story
4. Run quality checks (typecheck, lint, tests)
5. Commit if checks pass
6. Update `prd.json` to mark story as `passes: true`
7. Append learnings to `progress.txt`
8. Repeat until all stories pass or max iterations reached

### Developing the Platform

```bash
cd ralph-orchestrator
npm install
npm run dev
```

## Tech Stack (Platform)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| UI | shadcn/ui |
| Database | MongoDB Atlas |
| Auth | NextAuth.js |
| Infrastructure | AWS (ECS Fargate, Lambda, SQS, Secrets Manager) |
| IaC | Pulumi (TypeScript) |
| PWA | Serwist service worker |

## Key Documents

| Document | Purpose |
|----------|---------|
| [PRD.md](PRD.md) | Full product requirements with 48 user stories, data models, API specs |
| [ICP.md](ICP.md) | Ideal Customer Profile — who this product is for |
| [ralph-orchestrator/prd.json](ralph-orchestrator/prd.json) | Machine-readable user stories for Ralph autonomous execution |

## How the Platform Works

```
User composes "email" in Inbox
        ↓
    PROMPT.md generated
        ↓
    Queued via SQS
        ↓
    Provisioner Lambda wakes ECS agent
        ↓
    Ralph loop executes iterations
        ↓
    Status streams back via WebSocket
        ↓
    Artifacts attached on completion
        ↓
    Agent scales to zero
```

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Amp documentation](https://ampcode.com/manual)
