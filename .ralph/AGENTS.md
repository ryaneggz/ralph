# Ralph — Agent Instructions

## Overview

Ralph is an autonomous AI agent loop that runs AI coding tools (Amp or Claude Code) repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context.

## Commands

```bash
# Run Ralph loop with Claude Code
.ralph/ralph.sh --tool claude [max_iterations]

# Run Ralph loop with Amp (default)
.ralph/ralph.sh [max_iterations]
```

## Key Files

-   `.ralph/ralph.sh` — Ralph loop shell script (supports `--tool amp` or `--tool claude`)
-   `.ralph/prompt.md` — Amp agent instructions
-   `.ralph/.ralph/prd.json` — User stories for autonomous execution
-   `.ralph/prd.json.example` — Example PRD format reference
-   `.ralph/archive/` — Folder old tasks are archived

## Patterns

-   Each Ralph iteration spawns a fresh AI instance with clean context
-   Memory persists via git history, `progress.txt`, and `prd.json`
-   Stories should be small enough to complete in one context window
-   Always update AGENTS.md with discovered patterns for future iterations
