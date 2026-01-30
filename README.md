# Ralph — Autonomous Agent Orchestrator

A Git-based toolkit for orchestrating autonomous AI agent loops that iteratively complete user stories until a product requirement is done.

```bash
# tar
curl -L https://github.com/ryaneggz/ralph/archive/refs/heads/master.tar.gz | tar xz

# zip
curl -LO https://github.com/ryaneggz/ralph/archive/refs/heads/master.zip && unzip master.zip

# git clone
git clone https://github.com/ryaneggz/ralph.git
```

---

## What is Ralph?

Ralph is an autonomous AI agent orchestration system that operates as a continuous loop, working through user stories defined in a Product Requirements Document (PRD). Unlike traditional development workflows where a human manually assigns tasks, Ralph reads your PRD, picks the next incomplete story, attempts to implement it, verifies the work, and repeats until all stories pass their acceptance criteria.

The system is designed to work as a **Git submodule** that can be embedded in any codebase. It's tool-agnostic, supporting both Claude Code and Amp AI tools, and relies on structured JSON-based PRDs to maintain clarity about what needs to be built. Ralph excels at long-running, unattended development sessions where stories build upon each other incrementally.

Think of Ralph as your persistent pair programmer who never gets tired, always documents their work, and systematically works through your backlog while you sleep.

---

## Quick Start

### 1. Add Ralph as a Submodule

```bash
# From your project root
git submodule add https://github.com/ryaneggz/ralph-orchestrator.git .ralph
git submodule update --init --recursive
```

### 2. Copy the Makefile

```bash
cp .ralph/Makefile ./Makefile
```

Or create your own with these targets:

```makefile
.PHONY: ralph params archive

ENV ?= dev
MAX_ITERATIONS ?= 200

params:
	@echo "Environment: $(ENV) | Max iterations: $(MAX_ITERATIONS)"

ralph:
	./.ralph/ralph.sh --tool claude $(MAX_ITERATIONS)

archive:
	claude --dangerously-skip-permissions -p "Archive the latest .ralph/prd.json & .ralph/progress.txt into ./.ralph/archives/YYYY-MM-DD/ directory."
```

### 3. Create Your PRD

Copy the example and customize it:

```bash
cp .ralph/prd.json.example .ralph/prd.json
```

Edit `.ralph/prd.json` with your project name, branch, and user stories (see **PRD Format** section below).

### 4. Run Ralph

```bash
make ralph
```

Ralph will now:
- Read `.ralph/prd.json`
- Check out or create the branch specified in `branchName`
- Iterate through incomplete user stories
- Commit work after each story
- Update `.ralph/progress.txt` with results
- Stop when all stories pass or max iterations reached

---

## How It Works

Ralph follows a simple iteration cycle:

```
1. READ prd.json → Find next incomplete story
2. PROMPT → Send story + acceptance criteria to AI tool
3. IMPLEMENT → AI makes changes, runs tests/typechecks
4. VERIFY → Check if acceptance criteria met
5. COMMIT → Git commit with story ID and description
6. UPDATE → Mark story as passing/failing in prd.json
7. REPEAT → Until all stories pass or COMPLETE promise found
```

Each iteration is logged to `.ralph/progress.txt` so you can trace exactly what happened during the session.

---

## Key Files

| File | Purpose |
|------|---------|
| `ralph.sh` | Main orchestration script — the autonomous loop |
| `prompt.md` | System prompt sent to AI on every iteration |
| `CLAUDE.md` | Project context guide (replace with your project's CLAUDE.md) |
| `AGENTS.md` | Agent-specific instructions (replace with your project's AGENTS.md) |
| `prd.json` | Product Requirements Document — the source of truth |
| `prd.json.example` | Template showing proper PRD structure |
| `progress.txt` | Append-only log of each iteration's result |
| `archives/` | Historical PRDs and progress logs, organized by date |
| `LICENSE` | MIT License |

---

## PRD Format

The `prd.json` file defines what Ralph will build. Here's the structure:

```json
{
  "project": "MyApp",
  "branchName": "ralph/task-priority",
  "description": "Task Priority System - Add priority levels to tasks",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add priority field to database",
      "description": "As a developer, I need to store task priority so it persists across sessions.",
      "acceptanceCriteria": [
        "Add priority column to tasks table: 'high' | 'medium' | 'low' (default 'medium')",
        "Generate and run migration successfully",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display priority indicator on task cards",
      "description": "As a user, I want to see task priority at a glance.",
      "acceptanceCriteria": [
        "Each task card shows colored priority badge (red=high, yellow=medium, gray=low)",
        "Priority visible without hovering or clicking",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Required Fields

- **project**: Human-readable project name
- **branchName**: Git branch Ralph will create/use (convention: `ralph/feature-name`)
- **description**: One-line summary of what this PRD accomplishes
- **userStories**: Array of story objects

### User Story Structure

- **id**: Unique identifier (e.g., `US-001`)
- **title**: Short, actionable description
- **description**: User story in "As a [role], I want [goal]" format
- **acceptanceCriteria**: Array of specific, testable conditions
- **priority**: Numeric priority (lower = higher priority)
- **passes**: Boolean — Ralph updates this after verification
- **notes**: Optional field for agent notes/debugging

---

## Writing Good User Stories

### Right-Sized Stories ✅

```json
{
  "id": "US-003",
  "title": "Add loading spinner to submit button",
  "description": "As a user, I want visual feedback when submitting a form.",
  "acceptanceCriteria": [
    "Button shows spinner icon during async submit",
    "Button is disabled while loading",
    "Typecheck passes",
    "Verify in browser using dev-browser skill"
  ],
  "priority": 3,
  "passes": false
}
```

**Why it works**: Single responsibility, clear visual outcome, easy to verify.

### Too Big ❌

```json
{
  "id": "US-999",
  "title": "Build complete authentication system",
  "description": "As a user, I want to sign up, log in, reset password, and manage sessions.",
  "acceptanceCriteria": [
    "User registration with email validation",
    "Login with JWT tokens",
    "Password reset flow with email",
    "Session management and refresh",
    "Admin user roles",
    "OAuth integration"
  ],
  "priority": 1,
  "passes": false
}
```

**Why it fails**: Too many responsibilities. Break this into 6+ smaller stories.

### Tips for Sizing

1. **One file or component per story** when possible
2. **UI stories should be visually verifiable** — include `dev-browser` skill in criteria
3. **Backend stories should be testable** — include test/typecheck requirements
4. **Dependencies should be explicit** — order stories by priority so prerequisites come first
5. **Acceptance criteria should be concrete** — avoid "should be good" or "works well"

---

## Running Ralph

### Basic Usage

```bash
make ralph
```

### With Custom Iterations

```bash
MAX_ITERATIONS=50 make ralph
```

### Using Different AI Tools

Edit `ralph.sh` call in Makefile:

```makefile
# Use Claude Code (default)
ralph:
	./.ralph/ralph.sh --tool claude $(MAX_ITERATIONS)

# Use Amp AI
ralph:
	./.ralph/ralph.sh --tool amp $(MAX_ITERATIONS)
```

### Check Current Settings

```bash
make params
# Output: Environment: dev | Max iterations: 200
```

---

## Debugging

### View Current PRD Status

```bash
cat .ralph/prd.json | jq '.userStories[] | select(.passes == false) | .id, .title'
```

This shows all incomplete stories.

### Check Progress Log

```bash
cat .ralph/progress.txt
```

Shows every iteration Ralph completed, including:
- Which story was attempted
- Whether it passed/failed
- Timestamp of completion

### View Recent Commits

```bash
git log --oneline -10
```

Each story completion should have its own commit with the story ID in the message.

### Inspect Specific Story

```bash
cat .ralph/prd.json | jq '.userStories[] | select(.id == "US-003")'
```

### Validate PRD JSON

```bash
cat .ralph/prd.json | jq empty
```

If there's a syntax error, jq will report the line number.

---

## AGENTS.md Updates

The `AGENTS.md` file lives at `.ralph/AGENTS.md` by default, but Ralph will use your project's root-level `AGENTS.md` if it exists.

**Why AGENTS.md matters**:
- Documents **how** your project's AI agents should behave
- Contains project-specific conventions (file naming, commit style, etc.)
- Gets updated as your project evolves
- Ralph reads this on every iteration

**When to update AGENTS.md**:
- You adopt a new testing framework
- You change your file structure conventions
- You add new scripts/commands agents should know about
- You discover common mistakes agents make

Example update:

```markdown
## Testing Conventions

All new features must include tests in `__tests__/` directory.

Run tests with: npm test
Run specific test: npm test -- ComponentName.test.ts

Do not commit code that breaks existing tests.
```

---

## Feedback Loops

Ralph works best when feedback loops are **fast and automated**.

### Typecheck (Critical)

```json
"acceptanceCriteria": [
  "Add User model to database",
  "Typecheck passes"
]
```

Include `typecheck passes` in every story. This catches 80% of issues immediately.

### Tests (Highly Recommended)

```json
"acceptanceCriteria": [
  "formatCurrency() handles negative values correctly",
  "Unit tests pass",
  "Typecheck passes"
]
```

Tests prevent regressions when Ralph modifies existing code.

### CI Integration (Recommended)

If your repo has CI checks (GitHub Actions, etc.), Ralph's commits will trigger them. Review CI failures between Ralph sessions to catch integration issues.

### Linting

```json
"acceptanceCriteria": [
  "Code follows ESLint rules",
  "No linter warnings",
  "Typecheck passes"
]
```

Enforces code style consistency.

---

## Browser Verification

For UI-related stories, **always include browser verification** in acceptance criteria:

```json
{
  "id": "US-007",
  "title": "Add dark mode toggle to navbar",
  "acceptanceCriteria": [
    "Toggle button visible in navbar",
    "Clicking toggle switches theme",
    "Theme persists across page reloads",
    "Typecheck passes",
    "Verify in browser using dev-browser skill"
  ]
}
```

The `dev-browser` skill allows Claude Code to:
- Launch a browser
- Navigate to localhost
- Take screenshots
- Verify visual correctness

Without browser verification, UI stories often pass typecheck but render incorrectly.

---

## Stop Condition

Ralph stops iterating when it finds the **COMPLETE promise** in its response.

### How It Works

After every story, the AI tool evaluates:
1. Are all user stories marked `passes: true`?
2. Did all acceptance criteria genuinely pass?

If YES → AI responds with:
```
COMPLETE: All user stories in prd.json have been implemented and verified.
```

Ralph detects this string and gracefully exits, logging the completion to `progress.txt`.

### Manual Stop

You can also manually stop Ralph:
- Press `Ctrl+C` during iteration
- Set a low `MAX_ITERATIONS` value
- Update PRD to mark stories as passing

---

## Archiving

Ralph automatically archives PRDs when you switch branches.

### How Archiving Works

1. You finish a feature: `branchName: "ralph/dark-mode"`
2. You edit `prd.json` with new feature: `branchName: "ralph/user-profiles"`
3. You run `make ralph`
4. Ralph detects branch change
5. Archives `.ralph/prd.json` → `.ralph/archives/2026-01-29/prd.json`
6. Archives `.ralph/progress.txt` → `.ralph/archives/2026-01-29/progress.txt`

### Manual Archiving

```bash
make archive
```

This runs a Claude prompt to archive current PRD into a dated directory.

### Viewing Archives

```bash
ls -la .ralph/archives/
# Output:
# drwxr-xr-x  2026-01-15/
# drwxr-xr-x  2026-01-22/
# drwxr-xr-x  2026-01-29/

cat .ralph/archives/2026-01-22/prd.json | jq '.description'
# Output: "Dark Mode Feature - Theme switcher for entire app"
```

---

## Customizing

Ralph is designed to be customized per project.

### Customize `prompt.md`

Edit `.ralph/prompt.md` to change how Ralph instructs the AI:

```markdown
You are an autonomous agent working on {project}.

Current branch: {branchName}
Current story: {currentStory}

Guidelines:
- Always run typecheck before marking story complete
- Write tests for all business logic
- Use the project's existing patterns (check AGENTS.md)
- Commit after completing each story

Your task: {description}

Acceptance Criteria:
{acceptanceCriteria}
```

Variables like `{project}`, `{branchName}`, etc. are replaced by `ralph.sh` on each iteration.

### Customize `CLAUDE.md`

Replace `.ralph/CLAUDE.md` with your project's actual `CLAUDE.md`:

```bash
rm .ralph/CLAUDE.md
ln -s ../CLAUDE.md .ralph/CLAUDE.md
```

This ensures Ralph uses your project's real context document.

### Customize `AGENTS.md`

Same approach as CLAUDE.md:

```bash
rm .ralph/AGENTS.md
ln -s ../AGENTS.md .ralph/AGENTS.md
```

---

## References

### Inspiration

This orchestration pattern is heavily inspired by **Geoffrey Huntley's** work on autonomous AI development loops:

- [Long-running autonomous AI agents using Git](https://ghuntley.com/fractal/) by Geoffrey Huntley

### Claude Code Documentation

Ralph is designed to work seamlessly with Claude Code:

- [Claude Code Official Docs](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)

### Tool Options

- **Claude Code**: `--tool claude` (recommended for Sonnet 4.5 and Opus 4.5)
- **Amp AI**: `--tool amp` (legacy support)

---

## Best Practices

### 1. Start Small
Begin with 3-5 stories, verify Ralph completes them, then scale up.

### 2. Incremental Complexity
Order stories so each builds on the previous. Don't jump from "create database" to "deploy to production".

### 3. Frequent Commits
Ralph commits after every story. This creates a detailed Git history you can review and revert if needed.

### 4. Review Progress Regularly
Check `progress.txt` and `git log` after each Ralph session. Catch issues early.

### 5. Use Branches
Always use `ralph/*` branch naming convention. Never run Ralph directly on `main`/`master`.

### 6. Typecheck Everything
Include "Typecheck passes" in every single story's acceptance criteria.

### 7. Test UI Stories
Include "Verify in browser using dev-browser skill" for all UI work.

---

## Troubleshooting

### Ralph Keeps Failing Same Story

**Solution**: Story might be too large. Break it into smaller stories with narrower acceptance criteria.

### Ralph Makes Wrong Assumptions

**Solution**: Update `AGENTS.md` with clarifying context about your project's conventions.

### Typecheck Passes But Code is Wrong

**Solution**: Add explicit tests to acceptance criteria. Typecheck only validates types, not logic.

### Ralph Stops Early

**Solution**: Check `progress.txt` for error messages. Common causes:
- Git merge conflicts
- Missing dependencies
- Invalid acceptance criteria

### Branch Already Exists Error

**Solution**: Ralph tries to create the branch specified in `prd.json`. If it exists, either:
- Delete the branch: `git branch -D ralph/feature-name`
- Or change `branchName` in `prd.json` to something unique

---

## Contributing

Ralph is open-source under the MIT License. Contributions welcome via:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR with clear description

---

## License

MIT License - see `LICENSE` file for details.

---

## Credits

Created by [Ryan Eggleston](https://github.com/ryaneggz).

Inspired by the autonomous AI agent patterns pioneered by [Geoffrey Huntley](https://ghuntley.com).

Powered by [Claude Code](https://claude.com/claude-code) from Anthropic.
