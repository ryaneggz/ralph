# Ideal Customer Profile: Ralph

## One-Liner

Developers and AI engineers who want to run autonomous coding agents at scale without managing infrastructure.

---

## Primary Segment: Solo AI Engineer

### Demographics

-   **Role**: Full-stack developer, AI engineer, or indie hacker
-   **Company size**: Solo / 1–10 person team / freelancer
-   **Experience**: 3–10 years software engineering; 6–18 months using AI coding tools
-   **Geography**: Global, English-speaking, remote-first

### Behaviors

-   Already uses Claude Code, Cursor, Copilot, or similar AI coding assistants daily
-   Has experimented with autonomous agent loops (Ralph, Devin, SWE-agent, or custom scripts)
-   Runs agents manually from terminal; monitors them by tailing logs
-   Has an AWS account (personal or company) but minimal DevOps/infra expertise
-   Comfortable with TypeScript, Next.js, and modern web tooling
-   Active on X/Twitter, Hacker News, and AI engineering Discord communities

### Pain Points

1. **Infrastructure overhead**: Spinning up EC2/ECS for agent runs requires DevOps knowledge they don't have or don't want to spend time on
2. **No visibility**: Agent runs happen in a terminal; no unified dashboard to track multiple runs, review outputs, or share results
3. **No HITL pathway**: Once an agent starts, injecting feedback means killing and restarting — losing context and wasting compute
4. **Cost anxiety**: Agents left running burn money; no auto-scale-to-zero without custom CloudWatch alarms
5. **Context switching**: Managing prompts, configs, and outputs across multiple repos and terminals is fragmented

### What They Value

-   **Speed**: Compose a task and have an agent running in under 60 seconds
-   **Simplicity**: No Terraform/Pulumi knowledge required for basic usage
-   **Cost control**: Scale-to-zero by default; clear cost estimates before running
-   **Familiar UX**: Gmail-like inbox they already know how to use
-   **Flexibility**: Bring their own API keys and choose their LLM provider

### Willingness to Pay

-   $29–$99/month for platform access (compute billed separately via their own AWS)
-   High sensitivity to idle compute costs; values auto-scale-to-zero
-   Would pay more for team features, audit logs, and priority support

### How They Find Us

-   Word of mouth from AI engineering community (X, Discord, HN)
-   Blog posts and demos showing "Gmail for AI agents"
-   Ralph open-source community (already using the pattern)
-   Comparison searches: "managed agent infrastructure", "run AI agents on AWS"

---

## Secondary Segment: Team Lead / Engineering Manager

### Demographics

-   **Role**: Engineering manager, tech lead, or platform engineer
-   **Company size**: 10–100 engineers
-   **Experience**: 5–15 years; evaluating AI tools for team adoption

### Additional Pain Points

-   Needs visibility into what agents are doing across the team
-   Wants guardrails: templates, cost limits, audit logs
-   Concerned about API key security and credential management
-   Needs to justify ROI to leadership

### What They Value (Beyond Primary)

-   **Team management**: Shared projects, templates, and key management
-   **Audit trail**: Who ran what, when, and at what cost
-   **Guardrails**: Max concurrent agents, budget caps, approved templates
-   **Security**: Encrypted keys, least-privilege IAM, secret redaction in logs

### Willingness to Pay

-   $49–$199/seat/month for team plan
-   Enterprise: custom pricing for SSO, SAML, dedicated support

---

## Tertiary Segment: Platform Integrator

### Demographics

-   **Role**: AI platform engineer or agent framework developer
-   **Company size**: Startup building on top of agent ecosystems
-   **Context**: Building with deepagentsjs or similar multi-agent frameworks

### Pain Points

-   Needs reliable, API-accessible agent runtimes as subagents
-   Doesn't want to build provisioning and scaling infrastructure
-   Needs standard protocol compliance (spawn, message, stream, terminate)

### What They Value

-   **API-first**: RESTful + WebSocket; no UI dependency
-   **Reliability**: 99.9% uptime; idempotent operations; retry logic
-   **Protocol compliance**: deepagentsjs subagent interface
-   **Low latency**: Agent provisioning < 60s; message delivery < 500ms

### Willingness to Pay

-   Usage-based pricing: per agent-hour or per API call
-   $0.10–$0.50 per agent-hour (platform fee, compute separate)

---

## Anti-Personas (NOT Our Customer)

| Profile                                         | Why Not                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Non-technical business user                     | Requires developer knowledge to write PROMPT.md and understand agent output                     |
| Enterprise with strict on-prem requirements     | Platform is cloud-native (AWS); no on-prem deployment option at launch                          |
| Developer without any AI coding tool experience | Product assumes familiarity with AI-assisted development; no onboarding for first-time AI users |
| Cost-zero hobbyist                              | Requires AWS account with billing; not free-tier friendly for meaningful agent runs             |

---

## Buying Journey

```
Awareness          → Interest            → Evaluation         → Purchase           → Expansion
─────────────────────────────────────────────────────────────────────────────────────────────
Sees demo on X     → Signs up for        → Runs first agent   → Subscribes to      → Invites team
or HN post         → free tier           → with own API key   → paid plan for       → members;
                   →                     → and AWS creds      → higher limits       → uses API for
                   →                     →                    →                     → deepagentsjs
```

## Key Metrics to Track

| Metric                               | Why It Matters                                 |
| ------------------------------------ | ---------------------------------------------- |
| Time to first agent run              | Measures onboarding friction                   |
| Agent runs per user per week         | Measures engagement / stickiness               |
| HITL feedback injection rate         | Validates the inbox-as-orchestration model     |
| Scale-to-zero success rate           | Validates cost control promise                 |
| Idle compute cost per user           | Must be near $0 to retain cost-sensitive users |
| Net Promoter Score                   | Word-of-mouth is primary acquisition channel   |
| API adoption rate (tertiary segment) | Validates platform / subagent value prop       |

---

## Positioning Statement

**For** developers and AI engineers **who** run autonomous coding agents, **Ralph is** a managed platform **that** provides a Gmail-like inbox for composing, monitoring, and managing agent runs on auto-scaling AWS infrastructure. **Unlike** running agents from a terminal or building custom DevOps pipelines, **Ralph** gives you one-click provisioning, real-time visibility, human-in-the-loop feedback, and scale-to-zero cost control — all through an interface you already know how to use.
