---
name: linkedin-tonality-post
description: Generate a LinkedIn post matching the voice of a specific account (Ryan Eggleston, Ruska AI, or Prompt Engineers AI) by analyzing that account's corpus and embedded voice profile.
argument-hint: "account=ryan|ruska|prompteng <topic> [length=short|medium|long] [cta=yes|no] [bullets=yes]"
disable-model-invocation: true
allowed-tools: Read, Glob
---

# LinkedIn Tonality Post Generator (Multi-Account)

You produce a new LinkedIn post that matches the voice of a specific account.

## Inputs

- **Account**: from `$ARGUMENTS` — parse `account=ryan|ruska|prompteng` (required)
- **Topic**: the remaining text in `$ARGUMENTS` after extracting knobs (required)

**If the `account` parameter is missing**, do NOT guess. Respond with:

> Which account should I write for?
> - `account=ryan` — Ryan Eggleston (personal)
> - `account=ruska` — Ruska AI (brand)
> - `account=prompteng` — Prompt Engineers AI (brand)

## Account Registry

| Slug | Account Name | Corpus File | Pronoun | Identity |
|------|-------------|-------------|---------|----------|
| `ryan` | Ryan Eggleston | `corpus/ryan-eggleston.md` | I | Founder, builder, AI hacker |
| `ruska` | Ruska AI | `corpus/ruska-ai.md` | We | AI startup, product-focused |
| `prompteng` | Prompt Engineers AI | `corpus/prompt-engineers-ai.md` | We | Community, education platform |

## Voice Profiles

These embedded profiles serve as priors. The corpus refines them, but profiles prevent drift — especially when corpus has fewer than 5 posts.

### Ryan Eggleston (`ryan`)
- **Voice**: Casual, confident, builder/hacker energy. First person "I".
- **Openers**: Bold statement or hot take on line 1. Punchy, standalone.
- **Structure**: Short paragraphs (1-2 sentences). Frequent line breaks. Numbered or bulleted lists for frameworks. White space between ideas.
- **Lexicon**: "ship", "build", "unlock", "the thing nobody talks about", "here's the thing". Direct address to reader.
- **Persuasion**: Contrarian takes, personal experience as proof, mini-frameworks.
- **CTA**: Ends with one engaging question. Often "What's your..." or "Agree or disagree?"
- **Hashtags**: 3-5 hashtags at the end. Always includes #BuildInPublic.
- **Content pillars**: AI tooling, open-source, dev productivity, personal wins, shipping fast.

### Ruska AI (`ruska`)
- **Voice**: Technical but accessible. Startup energy. First person plural "We".
- **Openers**: Lead with a product update, data point, or insight. Professional but not stiff.
- **Structure**: Opening hook, context paragraph, bullet list of specifics, forward-looking close. Moderate line breaks.
- **Lexicon**: "shipped", "production-ready", "under the hood", "the result", "here's how". Technical terms explained briefly.
- **Persuasion**: Data-backed claims, architecture explanations, before/after comparisons.
- **CTA**: Ends with a question inviting technical discussion. "What challenges are you hitting with..."
- **Hashtags**: 3-4 hashtags. Always includes #RuskaAI.
- **Content pillars**: Product launches, features, architecture, AI engineering trends, hiring.

### Prompt Engineers AI (`prompteng`)
- **Voice**: Inclusive, warm, educational. Community-first. First person plural "We".
- **Openers**: Announcement or community moment. Celebratory or inviting energy.
- **Structure**: Narrative hook, supporting detail, bulleted takeaways or list, inclusive close. Generous spacing.
- **Lexicon**: "community", "together", "join us", "spotlight", "learn", "share". Encouraging tone.
- **Persuasion**: Social proof (member stories, participation numbers), educational value, accessibility.
- **CTA**: Invites participation — "Drop a comment", "What would you add?", "DM us your story".
- **Hashtags**: 3-4 hashtags. Always includes #PromptEngineersAI.
- **Content pillars**: Events, tutorials, member spotlights, tool reviews, beginner tips.

## Step 1 — Load corpus

1. Resolve the corpus file path from the Account Registry above.
2. The corpus files live relative to this skill file at `corpus/{file}`.
3. Use `Glob` to find the skill directory: `.claude/skills/linkedin-tonality-post/corpus/*.md`
4. Use `Read` to load the corpus file for the selected account.
5. If the corpus file is missing or empty, rely entirely on the embedded voice profile and note to the user that the corpus is empty.

## Step 2 — Extract tonality + writing DNA

From the corpus (and the embedded voice profile as a prior), infer and note internally:

- **Voice**: confident/casual/formal, energy level, humor
- **Sentence shape**: short/long mix, punchy lines, fragments
- **Structure**: common openings, lists, spacing, emoji usage, questions, hooks
- **Lexicon**: recurring phrases, favorite verbs, taboo words
- **Persuasion pattern**: storytelling vs frameworks, contrarian takes, proof points
- **CTA pattern**: question style, engagement approach

Also extract 8-15 **verbatim micro-patterns** (short phrases) that are safe to reuse.

**Cold-start rule**: If the corpus has fewer than 5 posts, weight the embedded voice profile at 80% and corpus at 20%. Otherwise weight corpus at 70% and profile at 30%.

## Step 3 — Draft the post

Create a single LinkedIn post on the given topic following the extracted style.

Hard requirements:

1. Output **only** the post text (no analysis, no preamble).
2. Keep it within **120-220 words** unless the user explicitly requests otherwise.
3. Use **line breaks** like typical LinkedIn formatting (1-2 sentences per paragraph).
4. Include **one** specific insight (a mini-framework, checklist, or concrete example).
5. End with **one** CTA question.
6. Use the correct **pronoun** for the account ("I" for ryan, "We" for ruska/prompteng).
7. Stay within the account's **content pillars** — do not drift into another account's territory.
8. Do **not** use emoji openers or heavy emoji unless the corpus for that account demonstrates that pattern.

## Optional style knobs (parse from $ARGUMENTS if present)

- `length=short` (80-120 words)
- `length=long` (220-350 words)
- `cta=no` (omit CTA question)
- `bullets=yes` (include a 3-5 bullet list)

If knobs conflict, prefer the last one provided.

## Validation checklist (before final output)

- [ ] Does it sound like the corpus author for this specific account?
- [ ] Is the correct pronoun used throughout ("I" for ryan, "We" for brands)?
- [ ] Is there a clear hook in the first 2 lines?
- [ ] Is there exactly one CTA question (unless `cta=no`)?
- [ ] Are hashtags present and include the account's signature hashtag?
- [ ] No cross-account voice contamination (e.g., no casual emoji openers on brand posts)?
- [ ] Did you avoid mentioning the corpus, tonality analysis, or voice profile?
- [ ] Is the post within the target word count?

## Examples

### Example 1: `account=ryan` topic="developer experience with AI code editors"

> The best AI code editor is the one you actually use every day.
>
> I've tried them all. Cursor, Copilot, Windsurf, Claude Code.
>
> Here's what I've learned after 6 months of switching:
>
> The editor matters less than your workflow around it.
>
> 3 things that actually move the needle:
> - How fast you can provide context
> - Whether it integrates with your existing tools
> - How quickly you can reject bad suggestions
>
> Stop chasing the "best" AI editor.
> Start optimizing how you work with the one you have.
>
> What's your daily driver for AI-assisted coding?
>
> #DeveloperExperience #AI #DevTools #BuildInPublic

### Example 2: `account=ruska` topic="new API versioning system"

> We just rolled out API v2 with full backwards compatibility.
>
> Our previous versioning approach required clients to migrate within 90 days. That created unnecessary pressure and broke trust with teams building on our platform.
>
> The new system:
> - All v1 endpoints continue working indefinitely
> - New features land exclusively in v2
> - A migration helper auto-rewrites v1 calls to v2 format
> - Deprecation warnings ship 6 months before any removal
>
> The result: teams upgrade on their schedule, not ours.
>
> We believe API stability is a feature, not a constraint.
>
> How does your team handle API versioning for AI services?
>
> #APIDesign #RuskaAI #Engineering #DevExperience

### Example 3: `account=prompteng` topic="beginner guide to system prompts"

> We see this question every week in our community: "What even is a system prompt?"
>
> So we put together the beginner guide we wish we had when we started.
>
> Here's the short version:
>
> A system prompt is your instructions to the AI before the conversation begins. Think of it as setting the stage.
>
> What makes a great system prompt:
> - Clear role definition ("You are a helpful writing tutor")
> - Specific constraints ("Keep responses under 100 words")
> - Output format ("Respond in bullet points")
> - Tone guidance ("Be encouraging, never dismissive")
>
> The full guide with templates is on our community hub -- link in comments.
>
> What was the first thing that "clicked" for you in prompt engineering?
>
> #PromptEngineering #BeginnerGuide #AIEducation #PromptEngineersAI

## Notes

- If **no** corpus file is found and the account slug is unrecognized, respond with: `Unknown account. Use account=ryan, account=ruska, or account=prompteng.`
- Never mix voices across accounts in a single post.
- When adding new posts to a corpus file, separate them with `---` horizontal rules.
