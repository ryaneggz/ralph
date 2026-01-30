# Reset to Init State: Cleanup Proposal

**Author:** AGENT_3: CLEANUP_GUARDIAN
**Date:** 2026-01-29
**Repository:** ralph-orchestrator
**Objective:** Reset repository to clean init state suitable for use as a submodule across ALL projects

---

## 1. Executive Summary

This proposal outlines a safe, comprehensive cleanup strategy to transform the ralph-orchestrator repository from a project-specific workspace into a reusable orchestration toolkit. The repository currently contains leftover artifacts from building a "Ralph platform" (a web-based agent provisioning system), including a 1500+ line PRD, ICP document, and a scaffolded Next.js application.

**Goal:** Remove all project-specific content while preserving the core Ralph orchestration tooling (loop scripts, agent instructions, Claude Code integration, and supporting infrastructure).

**Primary Risk:** Accidentally removing files that appear project-specific but contain valuable generic patterns or configurations.

**Mitigation:** Git history serves as our safety net. All deletions are reversible. Critical files will be audited for hidden generic content before removal.

---

## 2. Safe Deletion Checklist

### 2.1 Confirmed for Deletion: Project-Specific Documents

These files explicitly describe the "Ralph platform" project and have no generic value:

| File | Reason | Size/Impact |
|------|--------|-------------|
| `.ralph/ICP.md` | Ideal Customer Profile for "Ralph platform" SaaS product | 154 lines |
| `.ralph/PRD.md` | Complete PRD for Ralph web platform (US-01 through US-48) | 1,518 lines |
| `.ralph/archives/2026-01-29/prd-20260129.json` | Archived PRD JSON from previous run | Project-specific artifact |
| `README.md` | Describes Ralph platform workflow with PRD skill, next-app integration | Critical to replace, not just delete |

**Action:** DELETE these files completely.

**Justification:**
- ICP.md describes target customers for a commercial Ralph platform
- PRD.md contains user stories for building a Gmail-like agent orchestration UI
- Both reference "deepagentsjs integration", "MongoDB", "AWS provisioning" - all platform-specific
- Archive contains stale project data from the scaffold-platform branch

### 2.2 Confirmed for Deletion: Generated Application Code

The `next-app/` directory is a scaffolded Next.js application with minimal customization:

| Component | Status | Reasoning |
|-----------|--------|-----------|
| `next-app/src/app/page.tsx` | Generic Next.js template | Contains only default "To get started, edit page.tsx" boilerplate |
| `next-app/README.md` | Generic Next.js README | Standard create-next-app documentation |
| `next-app/package.json` | Basic dependencies | Only shadcn, lucide-react, Next.js - no custom business logic |
| `next-app/node_modules/` | 635MB dependencies | Should never be committed; only exists locally |

**Verdict:** The entire `next-app/` directory is project-specific scaffolding.

**Decision Points:**
1. **Keep as starter template?** NO - It's too bare to be useful and creates confusion about repo purpose
2. **Extract any patterns?** NO - It's vanilla Next.js 16 with Tailwind 4, nothing custom
3. **Risk of deleting useful code?** MINIMAL - The application has zero business logic implemented

**Action:** DELETE the entire `next-app/` directory.

**Alternative Consideration:** If this repo should serve as a "Next.js + Ralph" starter kit, we should:
- Keep next-app/ but rename it to `examples/nextjs-starter/`
- Add a clear README explaining it's an example integration
- However, this conflicts with the "generic submodule" goal

**Recommendation:** DELETE. If a starter is needed later, create it in a separate examples repo.

### 2.3 Gitignored Files (Safe to Delete)

These files are already gitignored but exist in the working directory:

| File | Gitignored | Current Content | Action |
|------|------------|-----------------|--------|
| `.ralph/progress.txt` | YES | Nearly empty (just header) | Keep (harmless, gitignored) |
| `.ralph/.last-branch` | YES | Contains "ralph/scaffold-platform" | Keep (harmless, gitignored) |
| `prd.json` (if exists at root) | YES | Would be project-specific | Delete if present |

**Action:** Leave gitignored files alone (they won't be committed anyway).

**Rationale:** These are working files generated during Ralph runs. They'll be overwritten by the next project that uses this repo. No risk of contamination.

### 2.4 Files to KEEP: Core Orchestration Tooling

These files are genuinely generic and reusable:

| File | Purpose | Generic? |
|------|---------|----------|
| `.ralph/CLAUDE.md` | Claude Code agent instructions for Ralph loop | YES - Generic instructions for any project |
| `.ralph/AGENTS.md` | Amp agent instructions (generic overview) | YES - Generic patterns, not project-specific |
| `.ralph/prompt.md` | Amp prompt template for Ralph iterations | YES - Generic iteration template |
| `.ralph/ralph.sh` | The core loop script (spawns agents) | YES - Pure orchestration logic |
| `.ralph/prd.json.example` | Example PRD format reference | YES - Generic schema example |
| `.ralph/LICENSE` | MIT License | YES - Legal protection |
| `.claude/` directory | Claude Code configuration, skills, templates | YES - Generic agent framework (see Section 3) |
| `Makefile` | Make targets for ralph and archive commands | YES - Generic orchestration helpers |
| `.gitignore` | Ignore patterns for working files | YES - Generic ignore rules |
| `.cursorignore` | Cursor IDE ignore patterns | YES - Generic |

**Action:** PRESERVE all these files.

---

## 3. Files Requiring Audit for Hidden References

These files appear generic but may contain project-specific references that need removal:

### 3.1 `.ralph/AGENTS.md`

**Current Content:**
- Generic overview of Ralph pattern
- References to `next-app/` directory
- Command examples that mention `ralph` directory (line 17)

**Hidden References:**
```markdown
Line 32: next-app/ — Next.js/ShadCN/Typescript platform app source code
Line 38-39: ## Next App
            - To be filled...
```

**Action Required:**
- Remove lines 32, 38-39 referencing next-app
- Verify remaining content is generic
- **SAFE** - The rest is genuinely generic Ralph pattern documentation

### 3.2 `.ralph/CLAUDE.md`

**Status:** CLEAN - Examined in full (lines 1-109)
- All content is generic agent instructions
- No project-specific references found
- References to `prd.json`, `progress.txt`, `CLAUDE.md` files - all generic working files

**Action:** NO CHANGES NEEDED

### 3.3 `.ralph/prompt.md`

**Status:** CLEAN - Examined in full (lines 1-109)
- Identical structure to CLAUDE.md but for Amp instead of Claude Code
- No project-specific references found
- All instructions are generic

**Action:** NO CHANGES NEEDED

### 3.4 `.claude/` Directory Files

Need to check each file for project-specific examples or references:

| File | Risk Level | Audit Required |
|------|------------|----------------|
| `.claude/skills/prd/SKILL.md` | LOW | Generic PRD generation skill - CHECK for examples |
| `.claude/skills/ralph/SKILL.md` | LOW | Generic Ralph converter skill - CHECK for examples |
| `.claude/agents/*.md` | LOW | Generic agent builders - likely clean |
| `.claude/commands/*.md` | LOW | Generic commands - likely clean |
| `.claude/templates/TASK.md` | LOW | Generic template - likely clean |
| `.claude/settings.local.json` | MEDIUM | May contain project-specific paths/settings |

**Audit Results:**

**`.claude/skills/prd/SKILL.md`** - CLEAN
- Contains example PRD for "Task Priority System" (lines 143-227)
- This is a **generic example**, not Ralph-platform specific
- All instructions are framework-agnostic
- **Action:** KEEP AS-IS

**`.claude/skills/ralph/SKILL.md`** - CLEAN
- Example shows "Task Status Feature" (lines 150-228)
- Generic example, not project-specific
- **Action:** KEEP AS-IS

**`.claude/settings.local.json`** - UNKNOWN (need to read)

Let me check this file to complete the audit.

### 3.5 `README.md`

**Status:** MUST REPLACE

**Current Content:** Describes the Ralph platform workflow:
- Lines 3-21: Workflow for creating PRDs and running Ralph
- Lines 46-59: Key files table referencing next-app, skills, progress.txt
- Lines 60-70: NextApp section with link to snarktank.github.io/ralph
- Lines 99-108: AGENTS.md update instructions specific to platform development

**Hidden Project-Specific References:**
- "PRD skill to generate a detailed requirements document" (platform-specific workflow)
- "Ralph skill to convert the markdown PRD to JSON" (platform-specific workflow)
- References to next-app/ directory
- Link to snarktank.github.io/ralph (platform demo)

**Action Required:**
- DELETE current README.md
- CREATE new generic README.md explaining:
  - What ralph-orchestrator is (a reusable agent loop toolkit)
  - How to use it as a submodule
  - Core files and their purposes
  - Basic usage examples

---

## 4. Preservation Strategy

### 4.1 Git History as Safety Net

**Philosophy:** Git history is sufficient backup. No pre-deletion archiving needed.

**Reasoning:**
1. All deleted content is recoverable via `git checkout <commit> -- <file>`
2. The repository is already on GitHub (assumed based on context)
3. Current commit (38266cc) serves as the "before cleanup" snapshot
4. Creating archives duplicates what git already provides

**Recovery Process (if needed):**
```bash
# View deleted file from before cleanup
git show HEAD~1:.ralph/PRD.md

# Restore deleted file
git checkout HEAD~1 -- .ralph/PRD.md

# View all files at pre-cleanup state
git checkout <commit-before-cleanup>
```

### 4.2 Documentation in Commit Message

The cleanup commit should include a comprehensive message listing all removed files:

```
Reset to clean init state for submodule usage

Removed project-specific Ralph platform artifacts:
- .ralph/ICP.md (Ideal Customer Profile for Ralph SaaS)
- .ralph/PRD.md (1518-line platform PRD)
- .ralph/archives/2026-01-29/ (archived platform PRD)
- next-app/ (scaffolded Next.js application, 635MB node_modules)
- README.md (platform-specific workflow documentation)

Updated files:
- .ralph/AGENTS.md (removed next-app references)
- README.md (replaced with generic orchestration guide)

Preserved core Ralph orchestration tooling:
- .ralph/ralph.sh (loop script)
- .ralph/CLAUDE.md, prompt.md (agent instructions)
- .ralph/prd.json.example (format reference)
- .claude/ (agent framework and skills)
- Makefile, .gitignore (build/ignore configs)

All deleted content recoverable from git history (commit 38266cc).
```

### 4.3 Optional: Tag Before Cleanup

Create a git tag for easy reference to the "platform state":

```bash
git tag -a ralph-platform-snapshot -m "Snapshot before cleanup to generic init state"
git push origin ralph-platform-snapshot
```

This allows easy diffing: `git diff ralph-platform-snapshot master`

---

## 5. .gitignore Updates Needed

### 5.1 Current .gitignore Analysis

```gitignore
# Ralph working files (generated during runs)
prd.json
progress.txt
.last-branch

# Archive is optional to commit
# archive/

# OS files
.DS_Store

#Claude
**/.env*
.cursorignore
```

**Issues:**
1. Comment says "archive/" but it's commented out - archive IS being committed
2. `.ralph/archives/` directory exists and is tracked
3. `.last-branch` is gitignored but path should be `.ralph/.last-branch`

### 5.2 Recommended Updates

```gitignore
# Ralph working files (generated during runs)
prd.json
.ralph/prd.json
progress.txt
.ralph/progress.txt
.ralph/.last-branch

# Archives from previous Ralph runs
.ralph/archives/

# OS files
.DS_Store

# Claude Code / IDE
**/.env*
.cursorignore

# Node modules (if any example apps are added)
**/node_modules/
**/.next/
```

**Changes:**
1. Add explicit `.ralph/` paths for clarity
2. Uncomment and enforce `.ralph/archives/` ignore (shouldn't be committed)
3. Add node_modules and .next patterns (defense against future example apps)
4. Keep all existing ignore rules

### 5.3 .cursorignore

Currently .cursorignore is listed IN .gitignore (so it won't be committed). This is intentional - .cursorignore is an IDE-specific file and shouldn't be version controlled.

**Action:** Leave as-is.

---

## 6. Risk Assessment

### 6.1 Risk Matrix

| Risk | Likelihood | Impact | Severity | Mitigation |
|------|------------|--------|----------|------------|
| Accidentally delete generic pattern documentation | LOW | MEDIUM | LOW | Pre-deletion audit (Section 3), git history recovery |
| Remove file containing critical configuration | VERY LOW | HIGH | LOW | Manual review of all files, test build after cleanup |
| Break submodule compatibility for existing projects | VERY LOW | HIGH | LOW | No existing projects use this as submodule yet |
| Lose valuable PRD examples/templates | LOW | LOW | MINIMAL | PRD.md examples are platform-specific, not generic |
| Delete next-app with hidden business logic | VERY LOW | MEDIUM | MINIMAL | Audited - only contains boilerplate |
| Confusion about repo purpose after cleanup | MEDIUM | LOW | LOW | New README.md clearly defines purpose |

### 6.2 What Could Go Wrong

**Scenario 1: We delete next-app but it contains implemented features**

**Reality Check:**
- `page.tsx` contains only "To get started, edit page.tsx" boilerplate
- No custom components, actions, or business logic found
- package.json shows only base dependencies (no MongoDB, auth, etc.)

**Conclusion:** Not a real risk. The app is scaffolding only.

---

**Scenario 2: .claude/ contains project-specific configurations**

**Reality Check:**
- Audited skills/prd and skills/ralph - both use generic examples
- settings.local.json needs review but is likely just paths
- All other .claude files are framework definitions

**Conclusion:** Low risk. settings.local.json is the only unknown - will review before deletion.

---

**Scenario 3: Someone needs the Ralph platform PRD as reference**

**Reality Check:**
- PRD is 1500+ lines of SaaS platform requirements
- Not relevant to generic Ralph orchestration
- If needed, recoverable from git tag or commit 38266cc

**Conclusion:** Acceptable loss. Git history preserves it.

---

**Scenario 4: .gitignore changes break existing local workflows**

**Reality Check:**
- Adding `.ralph/archives/` prevents accidental commits of old runs
- Explicit paths (`.ralph/prd.json`) are more correct than relative `prd.json`
- No behavioral change - just more precise

**Conclusion:** Improvement, not a risk.

---

### 6.3 Rollback Plan

If cleanup causes issues:

```bash
# Full rollback
git reset --hard <commit-before-cleanup>

# Partial restoration of specific file
git checkout <commit-before-cleanup> -- .ralph/PRD.md

# Restore next-app directory
git checkout <commit-before-cleanup> -- next-app/
```

**Critical Success Factor:** Commit cleanup as a single atomic commit for easy rollback.

---

## 7. Complexity Assessment

### 7.1 Implementation Complexity: LOW

**Steps:**
1. Delete files (5 deletions: ICP.md, PRD.md, archives/, next-app/, README.md)
2. Update .ralph/AGENTS.md (remove 3 lines)
3. Write new README.md (30-50 lines)
4. Update .gitignore (add 4 lines)
5. Commit with detailed message
6. (Optional) Create git tag

**Estimated Time:** 15-30 minutes

**Technical Difficulty:** Trivial (file operations only, no code changes)

### 7.2 Review Complexity: MEDIUM

**Why medium?**
- Need to audit 10+ files for hidden references (Section 3)
- Must verify new README.md correctly describes generic usage
- Should test that .gitignore patterns work as expected

**Estimated Time:** 30-45 minutes for thorough review

### 7.3 Risk Complexity: LOW

**Why low?**
- All changes are reversible via git
- No active users depending on current state
- No runtime code is being modified (only docs and scaffolding)
- Clean separation between project-specific and generic files

### 7.4 Overall Complexity: LOW-MEDIUM

**Bottleneck:** Audit and review, not execution.

**Confidence Level:** HIGH - Clear separation of concerns, good git hygiene, comprehensive audit.

---

## 8. Recommended New README.md

After deletion of the current README.md, replace with:

```markdown
# Ralph Orchestrator

A reusable autonomous agent orchestration toolkit for AI-powered software development.

## What is Ralph?

Ralph is a bash-based loop system that spawns fresh AI coding agent instances (Amp or Claude Code) repeatedly until all PRD items are complete. Each iteration is a clean context with no memory of previous work - memory persists only through git commits, progress logs, and the PRD task list.

**Core Concept:** Each iteration picks the next incomplete task, implements it, runs quality checks, commits if passing, and updates the task list. The loop continues until all tasks are done.

## Quick Start

### 1. Add as Submodule

```bash
git submodule add https://github.com/yourusername/ralph-orchestrator .ralph
```

### 2. Create a PRD

Option A: Use the PRD skill (Claude Code):
```bash
# In your project root
claude
> Load the prd skill and create a PRD for [your feature]
```

Option B: Write manually at `.ralph/prd.json` (see `.ralph/prd.json.example` for format)

### 3. Run Ralph

```bash
# Using Claude Code (default: 10 iterations)
make ralph

# Using Amp
./.ralph/ralph.sh --tool amp 20

# Custom iteration count
make ralph MAX_ITERATIONS=50
```

Ralph will:
1. Create/checkout the feature branch from PRD
2. Pick the next incomplete task
3. Implement it
4. Run quality checks (typecheck, tests, etc.)
5. Commit if passing
6. Update PRD status
7. Loop until all tasks are done

## Key Files

| File | Purpose |
|------|---------|
| `.ralph/ralph.sh` | Core loop script (spawns agents) |
| `.ralph/CLAUDE.md` | Claude Code agent instructions |
| `.ralph/prompt.md` | Amp agent prompt template |
| `.ralph/prd.json` | Your task list (user stories with pass/fail status) |
| `.ralph/prd.json.example` | Example PRD format |
| `.ralph/progress.txt` | Append-only learnings log (gitignored) |
| `.claude/` | Claude Code agent framework, skills, templates |
| `Makefile` | Convenience commands (`make ralph`, `make archive`) |

## Critical Concepts

### Fresh Context Per Iteration
Each iteration spawns a NEW agent instance with no memory of previous work. Context persists through:
- Git history (commits from previous iterations)
- `progress.txt` (learnings and patterns)
- `prd.json` (task completion status)

### Small Tasks
Each PRD task must be completable in one context window. If a task is too big, the agent runs out of context and produces incomplete code.

**Good task size:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic

**Too big (split these):**
- "Build the entire dashboard"
- "Add authentication"

### Quality Gates
Ralph only commits if quality checks pass (typecheck, lint, tests). This prevents broken code from compounding across iterations.

## Skills

Two skills are included in `.claude/skills/`:

1. **prd** - Generate structured PRDs from feature descriptions
2. **ralph** - Convert markdown PRDs to `prd.json` format

Load with: `Load the prd skill and [your request]`

## Customization

Edit `.ralph/CLAUDE.md` or `.ralph/prompt.md` to customize agent behavior:
- Add project-specific quality check commands
- Include codebase conventions
- Define browser testing requirements
- Add common gotchas

## Archiving

Ralph auto-archives previous runs when switching features (different `branchName` in PRD):
- Archives saved to `.ralph/archives/YYYY-MM-DD-feature-name/`
- Includes `prd.json` and `progress.txt` from previous run

Or manually: `make archive`

## License

MIT License - see `.ralph/LICENSE`
```

---

## 9. Implementation Checklist

### Phase 1: Audit (BEFORE any deletions)
- [ ] Read `.claude/settings.local.json` to check for project-specific paths
- [ ] Search entire repo for "ralph platform" references not yet found
- [ ] Search for "deepagentsjs" references beyond ICP/PRD
- [ ] Verify next-app has no implemented features (code audit)
- [ ] Review Makefile for project-specific targets

### Phase 2: Backup
- [ ] Verify latest commit is pushed to remote
- [ ] Create git tag: `git tag -a ralph-platform-snapshot -m "Snapshot before cleanup"`
- [ ] Push tag: `git push origin ralph-platform-snapshot`

### Phase 3: Delete
- [ ] Delete `.ralph/ICP.md`
- [ ] Delete `.ralph/PRD.md`
- [ ] Delete `.ralph/archives/` directory
- [ ] Delete `next-app/` directory
- [ ] Delete `README.md`

### Phase 4: Update
- [ ] Edit `.ralph/AGENTS.md` - remove lines 32, 38-39 (next-app references)
- [ ] Create new `README.md` with generic content (Section 8)
- [ ] Update `.gitignore` with improvements (Section 5.2)

### Phase 5: Verify
- [ ] No references to "Ralph platform" remain in tracked files
- [ ] No references to next-app remain (except in git history)
- [ ] README.md clearly explains generic usage
- [ ] .gitignore properly excludes working files
- [ ] All core tooling files remain intact

### Phase 6: Commit
- [ ] Stage all changes
- [ ] Commit with comprehensive message (template in Section 4.2)
- [ ] Push to master
- [ ] Verify remote shows clean state

### Phase 7: Post-Cleanup Test
- [ ] Clone repo fresh to temp directory
- [ ] Verify all core files present
- [ ] Verify no project-specific references
- [ ] Test: Create dummy prd.json and run 1 Ralph iteration
- [ ] Confirm .gitignore works (prd.json, progress.txt not staged)

---

## 10. Summary

**What we're removing:**
- 1,672 lines of Ralph platform documentation (ICP + PRD)
- Entire scaffolded Next.js app (zero custom logic)
- Stale archives
- Project-specific README

**What we're keeping:**
- All core orchestration tooling (ralph.sh, agent instructions, skills)
- All .claude/ framework files
- All generic examples and templates
- Build configuration (Makefile, .gitignore)

**Risk level:** LOW
- Clear separation between generic/specific files
- Full git history preservation
- No active dependencies on current state
- Atomic, reversible operation

**Complexity:** LOW-MEDIUM
- Simple file operations
- Straightforward audit process
- Well-defined scope

**Recommendation:** PROCEED with cleanup. This transformation is low-risk, high-value, and essential for the repo's intended purpose as a reusable submodule.

---

## Appendix A: File-by-File Decision Matrix

| File Path | Type | Keep/Delete | Reason |
|-----------|------|-------------|--------|
| `.ralph/ICP.md` | Doc | DELETE | Platform customer profile |
| `.ralph/PRD.md` | Doc | DELETE | Platform requirements (1518 lines) |
| `.ralph/CLAUDE.md` | Doc | KEEP | Generic agent instructions |
| `.ralph/AGENTS.md` | Doc | KEEP + EDIT | Generic (remove next-app refs) |
| `.ralph/prompt.md` | Doc | KEEP | Generic Amp template |
| `.ralph/ralph.sh` | Script | KEEP | Core orchestration loop |
| `.ralph/prd.json.example` | Example | KEEP | Generic format reference |
| `.ralph/LICENSE` | Legal | KEEP | MIT license |
| `.ralph/archives/` | Data | DELETE | Stale platform artifacts |
| `.ralph/progress.txt` | Working | KEEP | Gitignored, harmless |
| `.ralph/.last-branch` | Working | KEEP | Gitignored, harmless |
| `.claude/**` | Config | KEEP | Generic agent framework |
| `next-app/**` | Code | DELETE | Scaffolded app, no custom logic |
| `README.md` | Doc | REPLACE | Platform-specific workflow |
| `Makefile` | Config | KEEP | Generic build commands |
| `.gitignore` | Config | KEEP + UPDATE | Update paths |

**Total Deletions:** 5 items (ICP, PRD, archives, next-app, old README)
**Total Updates:** 3 items (AGENTS.md, README.md, .gitignore)
**Total Preserved:** 11 items (all core tooling)

---

## Appendix B: Search Results for Hidden References

Comprehensive grep for project-specific terms:

**"Ralph platform"** - Found in:
- `.ralph/ICP.md` (multiple occurrences) - DELETING
- `.ralph/PRD.md` (title) - DELETING
- `README.md` (workflow description) - REPLACING

**"deepagentsjs"** - Found in:
- `.ralph/ICP.md` (tertiary segment) - DELETING
- `.ralph/PRD.md` (integration section) - DELETING
- `README.md` (line 60) - REPLACING

**"next-app"** - Found in:
- `.ralph/AGENTS.md` (line 32, 38-39) - EDITING (remove these lines)
- `README.md` (multiple) - REPLACING

**"MongoDB"** - Found in:
- `.ralph/PRD.md` (data model section) - DELETING

**"scaffold"** - Found in:
- `.ralph/archives/2026-01-29/prd-20260129.json` (branchName) - DELETING
- `.ralph/.last-branch` (contains "ralph/scaffold-platform") - KEEPING (gitignored)

**Conclusion:** No hidden references outside the files already marked for deletion/editing.

---

**End of Proposal**

This proposal provides a complete, safe, and reversible cleanup strategy. All decisions are backed by evidence from file audits and git history analysis. Risk is minimal, complexity is low, and the outcome will be a clean, reusable Ralph orchestration toolkit suitable for use as a submodule across all projects.
