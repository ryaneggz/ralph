# PROPOSAL: Reset Ralph Orchestrator to Clean Init State for Submodule Use

**Architect:** SUBMODULE_CRAFTSMAN
**Date:** 2026-01-29
**Repository:** ralph-orchestrator
**Objective:** Transform this repository from a project-specific implementation into a clean, reusable submodule suitable for integration into any project

---

## 1. Executive Summary

The `ralph-orchestrator` repository currently contains a powerful autonomous AI agent orchestration system (Ralph) mixed with leftover project-specific artifacts from a "Ralph platform" project (ICP.md, PRD.md describing a "Gmail for AI agents" product, and a Next.js scaffold app). This proposal outlines a comprehensive strategy to:

1. **Remove project-specific artifacts** that do not belong in a reusable tooling submodule
2. **Preserve and enhance generic Ralph orchestration tooling** that provides value across all projects
3. **Create clear, welcoming documentation** that helps developers quickly understand and integrate Ralph
4. **Establish examples and templates** that demonstrate best practices without coupling to specific projects

**Target State:** A clean, well-documented submodule that any team can add to their project with `git submodule add`, immediately gaining access to autonomous agent orchestration with Claude Code or Amp, without inheriting irrelevant project context.

**Key Principle:** Maximize reusability, minimize coupling, optimize for developer ergonomics.

---

## 2. What to Delete vs Keep vs Modify

### 2.1 DELETE - Project-Specific Artifacts

These files contain context specific to the "Ralph platform" product and should be removed entirely:

| File Path | Reason for Deletion | Risk Level |
|-----------|-------------------|------------|
| `.ralph/ICP.md` | 150-line Ideal Customer Profile for "Ralph platform" SaaS product. Not relevant to the orchestrator tooling itself. | **LOW** - No code dependencies |
| `.ralph/PRD.md` | 1500+ line Product Requirements Document describing a "Gmail for AI agents" web platform. This is project-specific product planning, not orchestrator documentation. | **LOW** - No code dependencies |
| `next-app/` directory | This appears to be a scaffold Next.js app created as a workspace for the Ralph platform project. It contains: <br/>- Standard Next.js boilerplate<br/>- ShadCN UI components setup<br/>- No Ralph-specific logic in source code<br/>- Generic "Getting Started" README<br/><br/>**Evidence:** The README in next-app/ is the default create-next-app template. The PRD.md references "next-app/" as "Application workspace for Ralph Agent" but inspection shows it's a standard scaffold with no orchestrator integration code. | **LOW** - Self-contained directory. The AGENTS.md line 32 references it but only as placeholder "To be filled..." |

**Deletion Impact Analysis:**
- **Dependencies:** None. These files are documentation/artifacts that exist alongside the core Ralph tooling but are not imported or referenced by the shell script, prompt templates, or agent instructions.
- **Git History:** All historical context is preserved in git history. If needed, these can be recovered with `git show commit:file`.
- **User Risk:** Zero. Anyone who submodules this repo is looking for the Ralph orchestration pattern, not the SaaS product planning docs.

### 2.2 KEEP - Core Ralph Orchestration Tooling

These files constitute the reusable Ralph system and should be preserved:

| File Path | Purpose | Action |
|-----------|---------|--------|
| `.ralph/ralph.sh` | Core loop script that spawns fresh AI agent instances iteratively | **KEEP** - This is the heart of Ralph |
| `.ralph/prompt.md` | Generic agent instructions template for Amp | **KEEP** - Reusable prompt template |
| `.ralph/CLAUDE.md` | Generic agent instructions template for Claude Code | **KEEP** - Reusable prompt template |
| `.ralph/AGENTS.md` | High-level overview of Ralph pattern for human developers | **MODIFY** - Update to remove project-specific references |
| `.ralph/prd.json.example` | Example format for PRD JSON structure | **KEEP** - Useful reference template |
| `.ralph/LICENSE` | MIT License (snarktank 2026) | **KEEP** - Critical for open source usage |
| `.ralph/archives/` | Archive directory with timestamp-based organization | **KEEP** - Part of Ralph's archiving feature |
| `.gitignore` | Ignores generated files (prd.json, progress.txt, .last-branch) | **KEEP** - Correct for submodule usage |
| `.cursorignore` | Cursor-specific ignore patterns | **KEEP** - Developer ergonomics |
| `Makefile` | Convenient commands for running Ralph and archiving | **MODIFY** - Update targets and docs |
| `.claude/` directory | Claude Code integration files | **KEEP MOSTLY** - See section 2.3 |

**Rationale:** These files implement the core Ralph pattern: autonomous iteration loops with fresh context, progress tracking, PRD-driven development, and quality gates. This is exactly what teams want when they add ralph-orchestrator as a submodule.

### 2.3 KEEP & ENHANCE - Claude Code Integration (.claude/)

The `.claude/` directory contains valuable Claude Code integration:

| Subdirectory/File | Purpose | Action |
|-------------------|---------|--------|
| `.claude/settings.local.json` | Hooks config, plugin settings, permissions | **KEEP** - Shows integration patterns |
| `.claude/hooks/notify_slack.sh` | Example webhook notification | **KEEP** - Useful example of extensibility |
| `.claude/templates/TASK.md` | Generic task template example | **KEEP** - Good starter template |
| `.claude/agents/` | Builder agent templates (agent-builder, command-builder, skill-builder) | **KEEP** - Reusable meta-agents |
| `.claude/commands/` | Team and ticket command definitions | **KEEP** - Demonstrate extensibility patterns |
| `.claude/skills/prd/` | PRD skill for generating requirements | **KEEP** - Useful for any project |
| `.claude/skills/ralph/` | Ralph skill for converting PRDs to JSON | **KEEP** - Core Ralph workflow |

**Rationale:** These demonstrate how Ralph integrates with Claude Code's ecosystem (skills, commands, hooks) and provide patterns teams can copy/adapt.

### 2.4 MODIFY - Documentation Files

| File Path | Current State | Required Changes |
|-----------|--------------|------------------|
| `README.md` | Project-specific content about "Ralph platform", deepagentsjs, "Gmail for AI agents" | **MAJOR REWRITE** - See section 3 |
| `.ralph/AGENTS.md` | Generic overview with one project-specific line referencing next-app | **MINOR EDIT** - Remove line 32 reference to next-app or replace with generic example |
| `Makefile` | Works but no documentation explaining targets | **ADD COMMENTS** - Document each target's purpose |

---

## 3. README.md Content Strategy

### 3.1 Current Problems

The current README.md (156 lines) contains:
- Workflow instructions mixed with project-specific references
- "NextApp" section with external link to `snarktank.github.io/ralph/`
- References to `next-app/` as the "Application workspace for Ralph Agent"
- Generic Ralph concepts buried in project-specific context

**Core Issue:** A developer evaluating ralph-orchestrator as a submodule encounters project-specific product marketing ("Gmail for AI agents", "deepagentsjs") before understanding what Ralph actually does for **their** project.

### 3.2 Proposed New Structure

Transform README.md into a clean, welcoming submodule-oriented document:

```markdown
# Ralph Orchestrator

> Autonomous AI agent orchestration for any codebase

Ralph runs AI coding tools (Claude Code or Amp) in iterative loops to autonomously
implement features, fix bugs, and refactor code — with built-in quality gates,
progress tracking, and context management.

## What is Ralph?

Ralph is an autonomous agent pattern where each iteration spawns a **fresh AI instance**
with clean context. This prevents context exhaustion and allows Ralph to work on
complex, multi-story features over many iterations.

**Key Concepts:**
- Each iteration = fresh AI agent (no context carryover)
- Memory persists via: Git commits, `progress.txt`, `prd.json` status
- Quality gates ensure broken code never propagates
- Works with Claude Code or Amp (configurable)

## Quick Start

### 1. Add as Submodule
git submodule add <repo-url> .ralph
git submodule update --init --recursive

### 2. Create a PRD
See `.ralph/prd.json.example` for format. Each user story should be small enough
to complete in one context window (~15-30 minutes of work).

### 3. Run Ralph
make ralph MAX_ITERATIONS=10  # or:
./.ralph/ralph.sh --tool claude 10

Ralph will:
1. Pick highest priority story where passes: false
2. Implement the story
3. Run quality checks (typecheck, tests)
4. Commit if checks pass
5. Update prd.json to mark passes: true
6. Append learnings to progress.txt
7. Repeat until all stories pass or max iterations

## File Structure
[Table showing .ralph/ contents with purpose of each file]

## Configuration
[How to customize prompt.md and CLAUDE.md for your project]

## Examples
[Link to example PRDs in prd.json.example]

## Advanced Usage
[Skills, commands, hooks for extensibility]

## References
- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)

## License
MIT - See LICENSE file
```

**Key Changes:**
1. **Lead with value proposition** - "What does Ralph do for me?"
2. **Remove product-specific context** - No "Gmail for AI agents", no deepagentsjs
3. **Submodule-first mindset** - Instructions assume reader is integrating into existing project
4. **Concrete quick start** - Get to running Ralph in 3 steps
5. **Preserve advanced features** - Show extensibility without requiring it
6. **Keep attribution** - Link to Geoffrey Huntley's original concept

### 3.3 Documentation Tone

**Target Audience:** Developers with 3-10 years experience, already using AI coding tools, want to try autonomous agents on their project.

**Writing Style:**
- Concise, direct, no marketing speak
- Show, don't tell (examples over abstract explanations)
- Assume reader is technical and time-constrained
- Respect the reader's existing codebase (Ralph adapts to them, not vice versa)

---

## 4. Template/Example Files Strategy

### 4.1 Keep as Reference Material

| File | Purpose | Value |
|------|---------|-------|
| `.ralph/prd.json.example` | Shows PRD JSON structure with realistic user stories | **HIGH** - Critical for onboarding. Shows proper story sizing, acceptance criteria format, priority handling |
| `.claude/templates/TASK.md` | Generic task template with Ralph instructions | **MEDIUM** - Good starting point for simple tasks |

**Action:** No changes needed. These are well-designed examples.

### 4.2 Add Complementary Examples

To maximize developer success, consider adding:

1. **`.ralph/examples/`** directory with:
   - `simple-prd.json` - 2-3 story feature (e.g., "Add dark mode toggle")
   - `refactoring-prd.json` - Refactoring example (e.g., "Extract API client")
   - `bugfix-prd.json` - Bug fix workflow (e.g., "Fix memory leak in cache")

2. **`.ralph/INTEGRATION.md`** - Checklist for integrating Ralph into existing project:
   ```markdown
   # Integrating Ralph into Your Project

   ## Prerequisites
   - [ ] Codebase has quality checks (typecheck, lint, test)
   - [ ] Quality checks are fast (< 5 minutes)
   - [ ] Team familiar with Claude Code or Amp

   ## Steps
   1. Add submodule (see README.md)
   2. Copy .ralph/prompt.md and customize quality checks section
   3. Create first PRD (use examples/ as reference)
   4. Run ralph.sh with MAX_ITERATIONS=1 to test integration
   5. Review output in progress.txt
   6. Scale up to larger features
   ```

**Rationale:** Examples lower friction. Developers learn fastest by copying working examples and modifying them.

### 4.3 Archive Old Examples

The `.ralph/archives/2026-01-29/` directory contains:
- Old archive data from previous Ralph runs
- Appears to be leftover from project-specific work

**Action:**
- **Option A (Recommended):** Delete entirely. Archives are per-project artifacts, not submodule content.
- **Option B (Conservative):** Keep the directory structure but empty it, with a `.gitkeep` and README explaining "Ralph will archive runs here".

**Recommendation:** Option A. The archive feature works regardless of directory pre-existence (ralph.sh creates as needed).

---

## 5. next-app/ Directory Decision

### 5.1 Evidence Analysis

**What is next-app/?**
- Full Next.js 16.1.6 application with node_modules (45MB+)
- ShadCN UI components setup (components.json exists)
- Tailwind CSS v4, TypeScript, ESLint configured
- Source code: Only 3 TypeScript files (utils.ts, layout.tsx, page.tsx)
- README.md: Default create-next-app boilerplate, unmodified

**References to next-app in codebase:**
1. `.ralph/AGENTS.md` line 32: "next-app/" with note "To be filled..."
2. README.md line 58: "Application workspace for Ralph Agent"
3. PRD.md (which we're deleting) extensively describes next-app as the platform being built

**Source code inspection:**
- `src/lib/utils.ts` - Standard ShadCN `cn()` utility, no Ralph-specific code
- `src/app/layout.tsx` - Standard Next.js root layout, no customization
- `src/app/page.tsx` - Empty landing page with Next.js default boilerplate

**Conclusion:** This is a vanilla Next.js scaffold created at the start of the Ralph platform project. It contains **zero Ralph-specific integration code**. The PRD describes this as the "application workspace" that Ralph would build, but inspection shows it was never developed beyond initial scaffold.

### 5.2 Recommendation: DELETE

**Reasons to Delete:**

1. **Not Ralph Tooling** - Ralph is the orchestration system. next-app/ is an empty application scaffold that was intended as the **output** of Ralph, not part of Ralph itself.

2. **Bloat** - Adds 45MB+ of node_modules to the submodule. Developers adding ralph-orchestrator as a submodule don't want to clone someone else's Next.js scaffold.

3. **Confusion** - Implies Ralph requires Next.js or is Next.js-specific. Ralph is framework-agnostic.

4. **No Reusable Code** - If next-app/ contained sophisticated Ralph integration examples (e.g., showing how to call ralph.sh from a web UI), keeping it would have value. But it's empty boilerplate.

5. **Maintenance Burden** - Keeping next-app/ means:
   - Updating Next.js, React, and 20+ other dependencies as they age
   - Security vulnerabilities in dependencies become repo vulnerabilities
   - Larger clone size for all submodule users

**Alternative Considered:**
Could we rename next-app/ to `examples/nextjs-integration/` and add Ralph integration code?

**Rejected because:**
- That's a new feature, not "resetting to clean init state"
- Would require actual integration code (doesn't exist yet)
- Better as separate example repo or wiki guide

**Migration Path for Anyone Using next-app/:**
- Archive to separate repo if it contains developed code (unlikely based on inspection)
- Teams with actual Next.js apps will use Ralph in their own app, not a scaffold

### 5.3 Implementation Steps for Deletion

```bash
# Remove directory
rm -rf next-app/

# Update references
# - Remove .ralph/AGENTS.md line 32 or replace with generic example
# - README.md rewrite (section 3) naturally removes references
```

**Risk:** Minimal. The directory is self-contained, no imports or symlinks from Ralph tooling.

---

## 6. Risk Assessment

### 6.1 High-Risk Changes (Require Careful Review)

| Change | Risk | Mitigation |
|--------|------|------------|
| Deleting PRD.md and ICP.md | Someone references these docs externally (blog post, presentation, etc.) | Keep in git history. Add note in README: "Historical product docs moved to archive branch". Create archive branch before deletion. |
| README.md major rewrite | Breaks existing workflows that parse README for info | Review README at multiple commits to check for tooling dependencies. Most likely pure human documentation. |

### 6.2 Medium-Risk Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Deleting next-app/ | Ralph loop references it in some undiscovered way | Grep entire codebase for "next-app" references before deletion. Test ralph.sh runs after deletion. |
| Modifying AGENTS.md | Agent prompts depend on specific wording | Keep changes minimal. Test one Ralph iteration after changes. |

### 6.3 Low-Risk Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Deleting archives/ old content | None - archives are regenerated as needed | Safe to delete |
| Updating Makefile comments | None - comments don't affect execution | Safe |
| Adding .ralph/examples/ | None - additive change | No risk |

### 6.4 Recommended Pre-Flight Checks

Before merging these changes to main/master:

1. **Grep for hidden dependencies:**
   ```bash
   grep -r "ICP.md" .
   grep -r "PRD.md" .
   grep -r "next-app" .
   grep -r "deepagentsjs" .
   ```

2. **Test Ralph loop:**
   ```bash
   # Create minimal test PRD
   # Run one Ralph iteration
   # Verify it completes without errors
   ```

3. **Review git history links:**
   - Check if any GitHub issues link to PRD.md or ICP.md
   - Add redirects or notes if heavily referenced

4. **Create archive branch (optional):**
   ```bash
   git checkout -b archive/ralph-platform-docs
   # Keep branch with PRD.md, ICP.md, next-app/ for historical reference
   ```

---

## 7. Complexity Assessment

### 7.1 Effort Estimation

| Task | Complexity | Estimated Time | Rationale |
|------|-----------|----------------|-----------|
| Delete ICP.md, PRD.md | **Trivial** | 5 minutes | `rm` commands, no dependencies |
| Delete next-app/ | **Simple** | 10 minutes | `rm -rf`, verify no references |
| Delete old archives/ | **Trivial** | 2 minutes | Optional cleanup |
| Rewrite README.md | **Medium** | 2-3 hours | Requires understanding Ralph deeply, writing clear docs, testing all code examples |
| Update AGENTS.md | **Simple** | 15 minutes | Remove 1-2 project-specific lines |
| Add .ralph/examples/ | **Simple** | 1 hour | Write 2-3 example PRD files |
| Add .ralph/INTEGRATION.md | **Simple** | 30 minutes | Checklist-style documentation |
| Update Makefile comments | **Trivial** | 10 minutes | Add header comments to targets |
| Test complete integration | **Simple** | 30 minutes | Run Ralph with example PRD, verify workflow |
| **TOTAL** | | **~5 hours** | Single developer, single session |

### 7.2 Complexity Factors

**LOW COMPLEXITY because:**
- Mostly deletion and documentation work
- No code refactoring required
- No dependency changes
- No breaking changes to core ralph.sh script
- ralph.sh is self-contained bash script with no external service dependencies

**Could become MEDIUM if:**
- Extensive external references to deleted docs require redirect planning
- Community expects certain documentation structure
- Need to maintain backwards compatibility (unlikely for a submodule)

### 7.3 Implementation Order

**Recommended sequence (lowest to highest risk):**

1. **Phase 1: Additive Changes (No Risk)**
   - Add `.ralph/examples/` directory with example PRDs
   - Add `.ralph/INTEGRATION.md`
   - Add Makefile comments
   - Test examples work

2. **Phase 2: Safe Deletions**
   - Delete `.ralph/archives/2026-01-29/` old content
   - Create archive branch (optional, for safety)

3. **Phase 3: Documentation Updates**
   - Rewrite README.md
   - Update AGENTS.md
   - Test all documentation links and code examples

4. **Phase 4: Artifact Deletions**
   - Delete `.ralph/ICP.md`
   - Delete `.ralph/PRD.md`
   - Delete `next-app/`
   - Verify no broken references with grep

5. **Phase 5: Integration Test**
   - Run complete Ralph workflow with new README examples
   - Verify submodule add/update works correctly
   - Get feedback from fresh eyes

**Rationale for order:** Start with additive changes that improve the repo immediately and risk nothing. End with deletions that are harder to undo (though still in git history).

---

## 8. Success Criteria

After implementing this proposal, the ralph-orchestrator repo should satisfy:

### 8.1 Developer Experience Goals

- [ ] **< 5 minute onboarding** - Developer unfamiliar with Ralph can read README and understand what it does
- [ ] **< 15 minute integration** - Add as submodule, create first PRD, run first iteration successfully
- [ ] **Zero confusion** - No project-specific artifacts that distract from core Ralph pattern
- [ ] **Clear examples** - At least 2-3 example PRD files demonstrating proper story sizing
- [ ] **Self-documenting** - Makefile targets have descriptions, key files have header comments

### 8.2 Technical Criteria

- [ ] **Submodule-clean** - No large binary artifacts (node_modules), no project-specific builds
- [ ] **Git history preserved** - All deleted content remains accessible via git log
- [ ] **No broken references** - `grep -r "PRD.md\|ICP.md\|next-app"` returns zero results in active code
- [ ] **Tests pass** - Run ralph.sh with example PRD, completes successfully
- [ ] **Documentation accurate** - All README code examples execute correctly when copy-pasted

### 8.3 Maintainability Goals

- [ ] **Reduced maintenance burden** - No framework dependencies to update (Next.js, React, etc.)
- [ ] **Clear scope** - Repository purpose is obvious: "Ralph orchestration tooling"
- [ ] **Extensibility examples** - .claude/ directory shows how to add skills, commands, hooks
- [ ] **License clarity** - MIT license remains prominent and unambiguous

---

## 9. Recommendations & Next Steps

### 9.1 Immediate Actions (High Priority)

1. **Create archive branch** (optional but recommended):
   ```bash
   git checkout -b archive/ralph-platform-2026-01
   git push origin archive/ralph-platform-2026-01
   ```
   This preserves PRD.md, ICP.md, next-app/ in easily-accessible branch for historical reference.

2. **Grep audit**:
   ```bash
   grep -r "PRD.md" --exclude-dir=.git .
   grep -r "ICP.md" --exclude-dir=.git .
   grep -r "next-app" --exclude-dir=.git .
   ```
   Document all references before deletion.

3. **Implement Phase 1** (Additive Changes):
   - Add examples directory
   - Add INTEGRATION.md
   - Get feedback - does this improve clarity?

### 9.2 Medium-Term Enhancements (Post-Reset)

After completing the clean init state reset, consider:

1. **CI/CD Integration Examples** - Add `.ralph/examples/ci-integration/` with GitHub Actions example
2. **PRD Skill Enhancement** - The .claude/skills/prd/ could be documented more thoroughly
3. **Quality Gate Templates** - Show examples for different tech stacks (TypeScript, Python, Go)
4. **Progress Visualization** - Small script to parse progress.txt into readable report

### 9.3 Long-Term Vision (Future Proposals)

Beyond this reset proposal, future enhancements could include:

1. **Ralph Configuration File** - `.ralphrc.json` to replace hardcoded values in prompt.md
2. **Web UI for Progress Tracking** - Separate repo with actual Ralph integration (what next-app/ could have been)
3. **Telemetry & Analytics** - Opt-in metrics on Ralph iteration success rates, common failure patterns
4. **Multi-Agent Orchestration** - Extend Ralph to coordinate multiple specialized agents

**But not now** - Focus on clean foundation first.

---

## 10. Appendix: File-by-File Decision Matrix

Complete reference for every file in the repository:

| Path | Decision | Rationale |
|------|----------|-----------|
| `.claude/` | KEEP | Demonstrates Claude Code integration patterns |
| `.claude/.example.env.claude` | KEEP | Shows environment variable pattern |
| `.claude/agents/agent-builder.md` | KEEP | Reusable meta-agent for building agents |
| `.claude/agents/command-builder.md` | KEEP | Reusable meta-agent for building commands |
| `.claude/agents/skill-builder.md` | KEEP | Reusable meta-agent for building skills |
| `.claude/commands/team.md` | KEEP | Example command demonstrating extensibility |
| `.claude/commands/ticket.md` | KEEP | Example command demonstrating extensibility |
| `.claude/hooks/notify_slack.sh` | KEEP | Example extensibility hook |
| `.claude/settings.local.json` | KEEP | Shows hooks config, plugin settings |
| `.claude/skills/prd/` | KEEP | Useful skill for any project |
| `.claude/skills/ralph/` | KEEP | Core Ralph workflow skill |
| `.claude/templates/TASK.md` | KEEP | Generic task template example |
| `.cursorignore` | KEEP | Developer ergonomics for Cursor users |
| `.gitignore` | KEEP | Correctly ignores generated files |
| `.ralph/` | KEEP | Core Ralph directory |
| `.ralph/.last-branch` | (Generated file, gitignored) | n/a |
| `.ralph/AGENTS.md` | MODIFY | Remove line 32 next-app reference |
| `.ralph/CLAUDE.md` | KEEP | Core agent instructions for Claude Code |
| `.ralph/ICP.md` | **DELETE** | Project-specific Ideal Customer Profile |
| `.ralph/LICENSE` | KEEP | MIT License - critical for usage |
| `.ralph/PRD.md` | **DELETE** | Project-specific 1500-line Product Requirements |
| `.ralph/archives/2026-01-29/` | DELETE | Old project-specific archived runs |
| `.ralph/prd.json.example` | KEEP | Critical reference template |
| `.ralph/progress.txt` | (Generated file, gitignored) | n/a |
| `.ralph/prompt.md` | KEEP | Core agent instructions for Amp |
| `.ralph/ralph.sh` | KEEP | **Heart of Ralph** - core loop script |
| `Makefile` | MODIFY | Add comments explaining targets |
| `README.md` | **REWRITE** | Currently project-specific, needs complete overhaul |
| `next-app/` | **DELETE** | Empty Next.js scaffold, not Ralph tooling |

---

## 11. Conclusion

Resetting ralph-orchestrator to a clean init state is a **low-complexity, high-value** change that transforms a project-specific repository into a professional, reusable submodule.

**Core Insight:** The Ralph orchestration pattern (ralph.sh + prompt templates + PRD workflow) is valuable and generic. The Ralph platform product docs (PRD.md, ICP.md) and empty scaffold app (next-app/) are leftover artifacts from a specific implementation that don't belong in the reusable tooling layer.

**Recommended Approach:**
1. Create archive branch for historical reference
2. Add examples and integration guide (additive, zero risk)
3. Rewrite documentation (medium effort, high impact)
4. Delete artifacts (low risk, immediate clarity improvement)
5. Test complete workflow with fresh eyes

**Estimated Effort:** ~5 hours for single developer
**Risk Level:** Low (mostly documentation, no code changes to core Ralph)
**Impact:** High (transforms niche project artifact into professional reusable submodule)

**Final Thought:** Ralph is already a brilliant pattern for autonomous agent orchestration. This reset proposal simply removes the clutter so that brilliance can shine through to every developer evaluating it as a submodule for their project.

---

**Proposal Status:** READY FOR REVIEW
**Next Step:** Technical review by maintainer, then implementation in phases per section 7.3
