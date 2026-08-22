> **Source** : rapport produit par ChatGPT, daté 2026-08-22.
> **Statut** : archive figée — la documentation officielle Anthropic prime toujours en cas de divergence.
> **Point d'entrée vivant et à jour** : <https://code.claude.com/docs/llms.txt>
> **Usage** : ce fichier est consulté via la skill `/choisir-mecanisme` (créée dans cette même session), ne pas le charger en session courante par défaut.

---

# Claude Code — Capabilities & Workflow Reference

> **Audience:** Claude Code  
> **Purpose:** operational reference for selecting and using Claude Code capabilities efficiently inside a repository.  
> **Documentation status:** 22 August 2026  
> **Sources:** official Anthropic / Claude Code documentation only.  
> **Rule:** when this file conflicts with current official documentation, the current official documentation wins.

---

## 0. Documentation entry points

Claude Code evolves quickly. Before implementing infrastructure around an assumed limitation, verify the current product documentation.

### Primary documentation index

- Complete LLM-oriented documentation index:  
  <https://code.claude.com/docs/llms.txt>

### Core references

- Overview: <https://code.claude.com/docs/en/overview>
- Documentation map: <https://code.claude.com/docs/en/claude_code_docs_map>
- Features overview: <https://code.claude.com/docs/en/features-overview>
- Tools reference: <https://code.claude.com/docs/en/tools-reference>
- Commands reference: <https://code.claude.com/docs/en/commands>
- CLI reference: <https://code.claude.com/docs/en/cli-reference>
- Platforms and integrations: <https://code.claude.com/docs/en/platforms>
- Feature availability: <https://code.claude.com/docs/en/feature-availability>
- What's new: <https://code.claude.com/docs/en/whats-new>
- Changelog: <https://code.claude.com/docs/en/changelog>
- Glossary: <https://code.claude.com/docs/en/glossary>

### Freshness rule

Before relying on a recent or experimental capability:

1. search `llms.txt`;
2. open the dedicated documentation page;
3. check feature availability;
4. check the changelog / What's New if behavior may depend on version;
5. inspect the locally installed Claude Code version;
6. only then implement custom infrastructure.

---

# 1. Claude Code agentic loop

## Purpose

Claude Code is an agentic coding environment, not only a conversational assistant. It can iteratively:

1. inspect the repository;
2. search for relevant code;
3. read files;
4. reason about the requested change;
5. edit files;
6. execute tools and shell commands;
7. inspect outputs;
8. correct mistakes;
9. validate the result;
10. continue until the task or completion condition is satisfied.

## Typical uses

- repository exploration;
- feature implementation;
- bug fixing;
- refactoring;
- test creation;
- build/debug cycles;
- Git operations;
- code review;
- documentation;
- migration work;
- automation.

## Operational principle

Prefer an evidence-driven loop:

```text
inspect
  ↓
hypothesis
  ↓
minimal change
  ↓
deterministic validation
  ↓
observe result
  ↓
correct if needed
```

Avoid large speculative rewrites before validating assumptions.

## Documentation

- <https://code.claude.com/docs/en/overview>
- <https://code.claude.com/docs/en/how-claude-code-works>
- <https://code.claude.com/docs/en/common-workflows>
- <https://code.claude.com/docs/en/best-practices>

---

# 2. Built-in tools

## Purpose

Claude Code exposes built-in tools for interacting with the development environment. The exact available tool set varies with version, platform, permissions, installed integrations, plugins and MCP configuration.

Typical categories include:

- reading files;
- editing files;
- searching filenames and file contents;
- semantic/code-intelligence operations where supported;
- shell/Bash execution;
- web/network-related operations where available;
- subagent delegation;
- skills;
- MCP tools;
- browser/computer-use tools in supported environments;
- background monitoring and scheduled operations where supported.

## Selection principle

Use the narrowest reliable tool.

Examples:

```text
Need exact symbol location
→ semantic/code search

Need a known configuration value
→ read the relevant small file

Need runtime evidence
→ run the relevant command/test

Need external structured integration
→ MCP

Need a reusable procedure
→ Skill

Need isolated investigation
→ subagent
```

Avoid reading entire directories or large files when targeted discovery is sufficient.

## Documentation

- <https://code.claude.com/docs/en/tools-reference>
- <https://code.claude.com/docs/en/how-claude-code-works>
- <https://code.claude.com/docs/en/permissions>

---

# 3. `CLAUDE.md`

## Purpose

`CLAUDE.md` provides persistent instructions and project context loaded into Claude Code sessions.

Use it for stable information with high global relevance:

- project architecture;
- important repository conventions;
- essential build/test/lint commands;
- project-wide constraints;
- mandatory development principles;
- critical source-of-truth pointers.

Example:

```md
## Commands

npm run typecheck
npm test
npm run lint

## Architecture

- Frontend: React + TypeScript
- Persistence: ...
- Main domain pipeline: ...

## Development rules

- Prefer minimal changes.
- Do not introduce dependencies without justification.
- Validate each pipeline stage before proceeding.
```

## Avoid

Do not turn `CLAUDE.md` into:

- a giant handbook;
- a task log;
- an exhaustive API reference;
- a collection of specialized procedures;
- temporary debugging notes;
- rules that apply only to one path.

Those often belong in:

- `.claude/rules/`;
- Skills;
- `TASKS.md`;
- `DECISIONS.md`;
- project documentation;
- Auto Memory.

## Optimization target

`CLAUDE.md` should be:

- concise;
- stable;
- globally relevant;
- easy to scan;
- high signal-to-token ratio.

## Documentation

- <https://code.claude.com/docs/en/memory>
- <https://code.claude.com/docs/en/claude-directory>
- <https://code.claude.com/docs/en/best-practices>

---

# 4. `CLAUDE.local.md`

## Purpose

Use local project memory/instructions for machine-specific or personal information that should not become shared repository policy.

Potential examples:

- machine-specific paths;
- local services;
- personal test fixtures;
- local development conventions;
- temporary local environment facts.

Do not place project-critical shared requirements only in local memory.

## Documentation

- <https://code.claude.com/docs/en/memory>
- <https://code.claude.com/docs/en/claude-directory>

---

# 5. `.claude/rules/`

## Purpose

Scoped rules let instructions apply only when relevant to specific files or parts of the repository.

This reduces global context pollution.

Typical examples:

```text
.claude/
└── rules/
    ├── frontend.md
    ├── api.md
    ├── tests.md
    └── database.md
```

Potential use cases:

- React conventions for `*.tsx`;
- database rules for schema/migration paths;
- test conventions for test files;
- specialized pipeline constraints;
- generated-code restrictions.

## Decision rule

If an instruction means:

> “Claude must know this only when working in subset X”

prefer a scoped rule over adding it to the root `CLAUDE.md`.

## Documentation

- <https://code.claude.com/docs/en/memory>
- <https://code.claude.com/docs/en/claude-directory>

---

# 6. Auto Memory

## Purpose

Claude Code provides automatic persistent memory in addition to human-maintained `CLAUDE.md`.

Auto Memory is suited to useful operational knowledge discovered while working, such as:

- recurring commands;
- repository quirks;
- debugging discoveries;
- patterns;
- local project knowledge that may be useful later.

## Distinction

```text
CLAUDE.md
→ explicit project instructions / normative context

Auto Memory
→ agent-learned operational knowledge
```

Claude treats both as context, not deterministic enforcement.

## Guidance

Do not duplicate every memory item into project documentation.

Promote knowledge only when it becomes stable and normative:

```text
discovered fact
  ↓
repeatedly useful?
  ↓
stable project truth?
  ↓
promote to CLAUDE.md / DECISIONS.md / Skill / documentation
```

## Documentation

- <https://code.claude.com/docs/en/memory>

---

# 7. Skills

## Purpose

Skills are reusable prompt-based workflows and domain procedures that Claude can invoke when relevant.

They are one of the best ways to keep specialized instructions out of the permanent global context.

Typical project structure:

```text
.claude/
└── skills/
    └── validate-model/
        └── SKILL.md
```

## Good candidates

- repeated validation workflows;
- import/export pipelines;
- release procedures;
- repository-specific audits;
- domain-specific generation workflows;
- complex debugging protocols;
- specialized review procedures.

## Decision rule

If the information answers:

> “How should Claude perform this recurring task?”

it is probably a Skill.

If it answers:

> “What must Claude always know about this repository?”

it is probably `CLAUDE.md`.

## Benefits

- context efficiency;
- reuse;
- clearer ownership of procedures;
- easier maintenance;
- less repeated prompting;
- discoverability by Claude.

## Documentation

- <https://code.claude.com/docs/en/skills>
- <https://code.claude.com/docs/en/features-overview>
- <https://code.claude.com/docs/en/best-practices>

---

# 8. Built-in commands

## Purpose

Commands control Claude Code from inside a session.

They cover areas including:

- models and effort;
- permissions;
- memory;
- sessions;
- plans;
- review;
- design synchronization;
- remote control;
- scheduling;
- usage;
- advanced cloud workflows.

The available list depends on:

- platform;
- plan;
- version;
- environment;
- feature availability.

## Important rule

Never assume the command list from memory. Use:

```text
/
```

inside Claude Code or consult:

<https://code.claude.com/docs/en/commands>

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/feature-availability>

---

# 9. Plan Mode

## Purpose

Plan Mode separates exploration/planning from disk modification.

Use it when:

- requirements are ambiguous;
- architecture must be understood first;
- the change is broad or risky;
- multiple implementation approaches exist;
- the user wants to review the plan before edits.

Typical flow:

```text
explore
  ↓
understand
  ↓
propose plan
  ↓
review
  ↓
implement
```

## Do not overuse

A trivial one-line fix does not necessarily justify a large planning phase.

Planning depth should be proportional to risk and uncertainty.

## Documentation

- <https://code.claude.com/docs/en/common-workflows>
- <https://code.claude.com/docs/en/permission-modes>
- <https://code.claude.com/docs/en/commands>

---

# 10. Custom Subagents

## Purpose

Subagents execute delegated work in separate context windows.

Claude Code includes built-in subagents such as Explore, Plan and general-purpose, and supports custom subagents.

Use subagents when a secondary task:

- requires broad exploration;
- produces lots of intermediate context;
- can return a compact conclusion;
- benefits from isolated instructions/tools/model;
- should not pollute the main implementation context.

## Typical uses

- repository mapping;
- log analysis;
- independent bug investigation;
- dependency research;
- security review;
- documentation search;
- alternative hypothesis testing;
- independent validation.

## Customization

Custom subagents can define their own:

- description;
- instructions;
- model;
- tools;
- permissions;
- hooks;
- Skills.

## Model economy

Use the cheapest model that preserves required reliability.

```text
file discovery / extraction
→ fast/cheap model

normal coding
→ standard coding model

difficult architectural arbitration
→ stronger model
```

## Documentation

- <https://code.claude.com/docs/en/sub-agents>
- <https://code.claude.com/docs/en/agents>
- <https://code.claude.com/docs/en/best-practices>

---

# 11. Context isolation with subagents

## Principle

The main value of delegation is often not parallelism but **context protection**.

Delegate when:

```text
large noisy investigation
      ↓
subagent
      ↓
short actionable result
      ↓
main context
```

Keep work in the parent when:

- the task is tiny;
- the intermediate reasoning directly drives implementation;
- delegation overhead is larger than the expected saving.

## Documentation

- <https://code.claude.com/docs/en/sub-agents>
- <https://code.claude.com/docs/en/agents>

---

# 12. Hooks

## Purpose

Hooks execute automatically at specific Claude Code lifecycle points.

Use hooks when a behavior should happen because of an event rather than because the LLM happened to remember an instruction.

Conceptually:

```text
Prompt:
"Always run X after Y"
→ probabilistic

Hook:
When Y happens → run X
→ enforced by configuration/code
```

## Typical use cases

- auto-formatting;
- validation;
- logging;
- notifications;
- policy checks;
- blocking prohibited behavior;
- test execution;
- repository-specific automation;
- integration with external systems.

## Hook types

Current Claude Code supports hook mechanisms including:

- command hooks;
- HTTP hooks;
- prompt hooks;
- MCP tool hooks;
- agent-based hooks for more complex judgment.

For production enforcement, deterministic command-based mechanisms should generally be preferred when they can express the rule.

## Documentation

- Guide: <https://code.claude.com/docs/en/hooks-guide>
- Reference: <https://code.claude.com/docs/en/hooks>

---

# 13. Deterministic vs agentic hooks

## Principle

Use deterministic code before LLM judgment.

Preferred validation ladder:

```text
exact comparison
↓
schema/parser
↓
compiler/type checker
↓
linter/static rule
↓
unit/integration test
↓
domain validator
↓
small LLM judgment
↓
agentic hook / strong model
```

An agent hook is appropriate only when the condition genuinely requires multi-turn inspection or judgment.

## Documentation

- <https://code.claude.com/docs/en/hooks>
- <https://code.claude.com/docs/en/hooks-guide>

---

# 14. Permissions

## Purpose

Permissions control which tools/actions Claude may execute automatically, which require confirmation, and which are forbidden.

Typical categories:

- Allow;
- Ask;
- Deny.

Use permissions to reduce repetitive confirmations without granting unnecessary power.

## Audit questions

For every rule:

1. Is it still required?
2. Is its scope broader than necessary?
3. Does it expose secrets?
4. Is Claude repeatedly asking for a safe operation that can be allowed?
5. Is a dangerous action allowed that should require confirmation?
6. Can a deny rule protect a sensitive file/path?

## Documentation

- <https://code.claude.com/docs/en/permissions>
- <https://code.claude.com/docs/en/permission-modes>
- <https://code.claude.com/docs/en/settings>

---

# 15. Permission Modes

## Purpose

Permission modes change how Claude interacts with approval boundaries.

Plan Mode is one example. Other modes may offer more or less autonomy depending on environment/version.

Use stricter modes for:

- high-risk operations;
- unfamiliar repositories;
- destructive commands.

Use carefully scoped automation for:

- test execution;
- local builds;
- routine read-only inspection.

## Documentation

- <https://code.claude.com/docs/en/permission-modes>
- <https://code.claude.com/docs/en/permissions>

---

# 16. Sandboxing

## Purpose

Sandboxing restricts tool execution at the OS/filesystem/network level, allowing greater agent autonomy without unrestricted machine access.

Useful for:

- autonomous tests;
- builds;
- dependency inspection;
- generated scripts;
- untrusted operations;
- more permissive agent workflows within controlled boundaries.

## Principle

Prefer:

```text
more autonomy + stronger sandbox
```

over:

```text
unrestricted machine access
```

when the sandbox can support the required workflow.

## Documentation

- <https://code.claude.com/docs/en/sandboxing>

---

# 17. Settings

## Purpose

Claude Code settings configure project/user behavior.

Settings can govern:

- permissions;
- hooks;
- plugins;
- MCP;
- environment behavior;
- feature configuration;
- project-level defaults.

## Scope principle

Version repository-critical configuration.

Keep personal preferences at user/local scope when possible.

## Documentation

- <https://code.claude.com/docs/en/settings>
- <https://code.claude.com/docs/en/claude-directory>

---

# 18. Environment variables

## Purpose

Environment variables can control Claude Code runtime behavior and feature toggles.

Do not scatter undocumented variables across project scripts.

Document any variable required for reproducible operation.

Examples of categories include:

- model configuration;
- authentication/provider configuration;
- disabling specific behavior;
- scheduled task behavior;
- memory behavior.

## Documentation

- <https://code.claude.com/docs/en/env-vars>

---

# 19. Model Context Protocol (MCP)

## Purpose

MCP connects Claude Code to structured external tools, services and data sources.

Examples:

- APIs;
- databases;
- issue trackers;
- internal tools;
- documentation systems;
- custom services.

Conceptually:

```text
Claude Code
   |
   +-- built-in tools
   |
   +-- MCP server
          |
          +-- external service
```

## Use criteria

Before adding MCP:

1. Is the integration recurring?
2. Is there already a simple CLI/API that is easier?
3. Will it materially reduce manual work?
4. Is the server trustworthy?
5. Can permissions be constrained?
6. Does adding many tools create unnecessary selection/context overhead?

## Documentation

- <https://code.claude.com/docs/en/mcp>
- <https://code.claude.com/docs/en/features-overview>

---

# 20. Channels

## Purpose

Channels are MCP-based integrations that **push external events into a running Claude Code session**.

Claude can react while the session is open, and some channels can support two-way communication.

Typical use cases:

- CI result arrives;
- monitoring event fires;
- external chat/message arrives;
- deployment status changes.

Conceptually:

```text
external event
    ↓
channel
    ↓
running Claude Code session
    ↓
analysis/action
```

## When to use

Prefer channels over polling when:

- an event source can push updates;
- the session remains active;
- immediate reaction is useful.

Do not treat channels as always-on durable automation unless the hosting/session architecture supports that explicitly.

## Documentation

- <https://code.claude.com/docs/en/channels>

---

# 21. Checkpointing

## Purpose

Claude Code maintains checkpoints around edits so conversation/code can be restored to an earlier point.

Use for short-term interactive recovery.

Do not substitute checkpointing for source control.

```text
checkpoint
→ local/session recovery

Git
→ durable project history
```

## Documentation

- <https://code.claude.com/docs/en/checkpointing>

---

# 22. `/rewind`

## Purpose

`/rewind` allows reverting conversation state, code state, or both to a prior checkpoint.

Useful when:

- implementation went down the wrong path;
- a hypothesis was wrong;
- later conversation context became undesirable;
- a previous code state was preferable.

Aliases/behavior may evolve; check the current command reference.

## Documentation

- <https://code.claude.com/docs/en/checkpointing>
- <https://code.claude.com/docs/en/commands>

---

# 23. Context management

## Principle

Context is a scarce resource.

Optimize for:

> maximum relevant information per token.

Avoid:

- whole-repository reads without need;
- duplicated instructions;
- oversized `CLAUDE.md`;
- keeping obsolete debugging logs;
- repeated rediscovery;
- broad exploration in the main context when isolation is possible.

## Preferred mapping

```text
Global stable instruction
→ CLAUDE.md

Path-specific instruction
→ .claude/rules/

Reusable procedure
→ Skill

Large isolated investigation
→ subagent

Unrelated new task
→ fresh session

Same task but bloated context
→ compaction
```

## Documentation

- <https://code.claude.com/docs/en/how-claude-code-works>
- <https://code.claude.com/docs/en/best-practices>
- <https://code.claude.com/docs/en/memory>

---

# 24. Compaction

## Purpose

Compaction summarizes older conversation state so work can continue without retaining every original token.

Use compaction when:

- the task is still substantially the same;
- earlier decisions remain useful;
- the current session is becoming large.

Prefer a fresh session when switching to unrelated work.

## Documentation

- <https://code.claude.com/docs/en/how-claude-code-works>
- <https://code.claude.com/docs/en/glossary>
- <https://code.claude.com/docs/en/commands>

---

# 25. Sessions: resume, rename and fork

## Purpose

Claude Code supports session continuity and branching workflows.

Useful operations include:

- resuming previous work;
- naming sessions;
- continuing by session identifier;
- creating alternate conversational branches;
- preserving context across restarts.

## Guidance

Resume when:

- continuing the same task;
- previous decisions matter;
- rediscovery would be wasteful.

Start fresh when:

- old context is stale;
- the new task is unrelated;
- accumulated assumptions are harmful.

Fork when:

- exploring an alternative approach;
- preserving the original reasoning path;
- comparing implementations.

## Documentation

- <https://code.claude.com/docs/en/cli-reference>
- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/common-workflows>

---

# 26. Git integration

## Purpose

Claude Code can interact with Git to inspect and manage repository history and changes.

Typical operations:

- status/diff inspection;
- branch management;
- commit creation;
- history inspection;
- PR workflows.

## Rule before commit

1. inspect the diff;
2. run relevant validation;
3. verify scope;
4. remove unrelated changes;
5. commit an atomic logical unit.

## Documentation

- <https://code.claude.com/docs/en/common-workflows>
- <https://code.claude.com/docs/en/best-practices>

---

# 27. Git worktrees

## Purpose

Git worktrees provide isolated working directories for simultaneous repository tasks.

Use when several agents/sessions modify the same repository concurrently.

Example:

```text
repo-main/
repo-feature-a/
repo-bug-b/
repo-review-c/
```

## Benefit

Reduces collisions between independent agents.

## Avoid

Do not create worktrees for simple sequential tasks where a single working tree is clearer.

## Documentation

- <https://code.claude.com/docs/en/agents>
- <https://code.claude.com/docs/en/common-workflows>

---

# 28. Parallel agents overview

Claude Code provides multiple forms of parallelism. Choose according to communication/isolation needs rather than simply maximizing agent count.

Main patterns:

- subagents;
- Agent View / parallel sessions;
- isolated worktree sessions;
- Agent Teams;
- Dynamic Workflows.

## Decision questions

1. Do workers need separate context?
2. Do they need to communicate with each other?
3. Do they modify code concurrently?
4. Does the parent need only compact results?
5. Is the coordination cost justified?

## Documentation

- <https://code.claude.com/docs/en/agents>

---

# 29. Agent View / parallel sessions

## Purpose

Agent View lets a user supervise multiple Claude Code sessions working in parallel.

This is useful when tasks are independent and report primarily to the user rather than coordinating directly with one another.

Typical uses:

- one session fixes backend bug;
- another explores UI issue;
- another reviews a branch.

## Difference from subagents

```text
Subagent
→ spawned within a parent conversation
→ reports back to parent

Agent View session
→ independent Claude Code session
→ user supervises sessions
```

## Documentation

- <https://code.claude.com/docs/en/agents>
- <https://code.claude.com/docs/en/whats-new>

---

# 30. Agent Teams

## Purpose

Agent Teams coordinate several Claude Code instances.

One session acts as lead and teammates:

- work in independent contexts;
- share a task list;
- communicate with one another;
- can be interacted with individually.

Use when collaboration among workers provides value.

## Good cases

- independent hypotheses that need synthesis;
- parallel subsystem analysis;
- broad migration with separable workstreams;
- implementation + independent critique.

## Cost

More agents increase:

- token consumption;
- duplicated exploration risk;
- coordination overhead;
- merge/reconciliation work.

Use a single agent or subagent where sufficient.

## Documentation

- <https://code.claude.com/docs/en/agent-teams>
- <https://code.claude.com/docs/en/agents>

---

# 31. Dynamic Workflows

## Purpose

Dynamic Workflows orchestrate large numbers of subagents from a script Claude writes.

They are intended for work where ordinary turn-by-turn orchestration would overload the primary context or coordination process.

Potential uses:

- very large audits;
- migrations over many modules;
- batch analysis;
- repeated parallel evaluation;
- large-scale research/verification.

## Escalation rule

Try in this order:

```text
deterministic script
↓
one agent
↓
one subagent
↓
few explicit subagents
↓
Agent Team
↓
Dynamic Workflow
```

Use Dynamic Workflows only when scale justifies orchestration complexity.

## Documentation

- <https://code.claude.com/docs/en/workflows>
- <https://code.claude.com/docs/en/whats-new>
- <https://code.claude.com/docs/en/agents>

---

# 32. `/goal`

## Purpose

`/goal` defines a completion condition and lets Claude continue working across turns until a small evaluator determines that the condition is satisfied, impossible, or blocked.

This is valuable for substantial work with a verifiable endpoint.

## Good goals

```text
All tests pass.
```

```text
The generated LDR passes the deterministic validator.
```

```text
The application builds successfully and no TypeScript errors remain.
```

## Bad goals

```text
Make the app perfect.
```

## Best practice

Use objective conditions.

```text
action
 ↓
validate
 ↓
goal satisfied?
 ├─ no → continue
 └─ yes → stop
```

## Documentation

- <https://code.claude.com/docs/en/goal>
- <https://code.claude.com/docs/en/commands>

---

# 33. Scheduled Tasks and `/loop`

## Purpose

Claude Code can run prompts on a schedule inside a session.

Use for:

- polling CI/deployment;
- waiting for a service;
- one-time reminders;
- repeated temporary checks;
- status monitoring.

`/loop` and cron scheduling tools are session-oriented.

## Important distinction

Do not confuse session scheduling with durable infrastructure-level cron.

## Documentation

- <https://code.claude.com/docs/en/scheduled-tasks>
- <https://code.claude.com/docs/en/commands>

---

# 34. Routines

## Purpose

Routines provide cloud automation for recurring or event-triggered Claude Code work.

They can be created through supported surfaces and can run based on:

- schedules;
- GitHub events;
- API calls.

This differs from local/session scheduled tasks.

## Good uses

- recurring repository maintenance;
- scheduled reviews;
- automated event-driven cloud tasks;
- repeated workflows that justify persistent automation.

## Avoid

Do not create a Routine for a workflow executed rarely or easily triggered manually.

## Documentation

- <https://code.claude.com/docs/en/routines>

---

# 35. Background monitoring / Monitor

## Purpose

Recent Claude Code versions include mechanisms for streaming background events into the conversation, allowing Claude to watch logs or react to ongoing processes.

Potential uses:

- follow a development server;
- observe logs;
- react to long-running process output;
- verify runtime behavior.

## Guidance

Use background observation when it provides real evidence.

Do not keep noisy log streams in primary context longer than needed.

## Documentation

- <https://code.claude.com/docs/en/whats-new>
- <https://code.claude.com/docs/llms.txt>

Search the current documentation index for `Monitor` because this capability is evolving.

---

# 36. Headless / programmatic execution

## Purpose

Claude Code can run non-interactively.

Typical use:

```bash
claude -p "..."
```

Appropriate for:

- scripts;
- CI/CD;
- batch tasks;
- machine-driven workflows;
- structured automation.

## Rule

Use headless mode when the task is standardized enough that interactive supervision is unnecessary.

## Documentation

- <https://code.claude.com/docs/en/headless>
- <https://code.claude.com/docs/en/cli-reference>

---

# 37. Structured output

## Purpose

Programmatic workflows should use machine-readable outputs when downstream tools consume results.

Prefer structured output over prose when a deterministic next stage exists.

Conceptual pipeline:

```text
Claude
  ↓
structured JSON
  ↓
schema validation
  ↓
deterministic processing
```

## Documentation

- <https://code.claude.com/docs/en/headless>
- <https://code.claude.com/docs/en/cli-reference>

---

# 38. Claude Agent SDK

## Purpose

The Claude Agent SDK exposes agentic capabilities programmatically for custom applications and workflows.

Potential uses:

- repository-processing agents;
- tool-controlled automation;
- application-specific coding agents;
- CI agents;
- batch processing.

## Complexity rule

If:

```bash
claude -p
```

solves the requirement, do not adopt the full SDK unnecessarily.

Use the SDK when you need deeper orchestration, lifecycle control, custom tools/hooks or application integration.

## Documentation

- Overview: <https://code.claude.com/docs/en/agent-sdk/overview>
- Quickstart: <https://code.claude.com/docs/en/agent-sdk/quickstart>
- TypeScript: <https://code.claude.com/docs/en/agent-sdk/typescript>
- System prompts: <https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts>
- SDK hooks: <https://code.claude.com/docs/en/agent-sdk/hooks>

---

# 39. GitHub Actions

## Purpose

Claude Code can operate in GitHub Actions for event-driven repository workflows.

Potential tasks:

- issue/PR response;
- implementation from mentions;
- automated analysis;
- PR creation;
- review workflows.

## Use criteria

Use when remote automation materially improves the workflow and credentials/permissions can be tightly scoped.

Do not migrate a stable local process to GitHub Actions only because integration exists.

## Documentation

- <https://code.claude.com/docs/en/github-actions>

---

# 40. GitLab CI/CD

## Purpose

Claude Code also supports GitLab CI/CD workflows for isolated AI tasks and merge-request based automation.

## Documentation

- <https://code.claude.com/docs/en/gitlab-ci-cd>

---

# 41. Code Review

## Purpose

Claude Code can independently review code changes.

Use review to detect:

- logical errors;
- regressions;
- security issues;
- missing cases;
- incorrect assumptions;
- maintainability problems.

## Recommended pattern

```text
implementation
   ↓
deterministic validation
   ↓
independent review
   ↓
verify findings
   ↓
minimal fixes
   ↓
final validation
```

Do not spend expensive model quota reviewing trivial changes already exhaustively checked by deterministic tools.

## Documentation

- <https://code.claude.com/docs/en/code-review>
- <https://code.claude.com/docs/en/commands>

---

# 42. `/review`

## Purpose

`/review` provides local pull-request/code review behavior within the current Claude Code workflow.

Use for ordinary review before escalation to deeper cloud multi-agent review.

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/code-review>

---

# 43. `/ultrareview`

## Purpose

`/ultrareview` provides deeper cloud-based multi-agent code review.

It is intended for cases where broad independent analysis is worth additional cost.

Good candidates:

- large architectural changes;
- high-risk core algorithms;
- security-sensitive code;
- major migrations;
- critical PRs.

Avoid on trivial edits.

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/whats-new>
- <https://code.claude.com/docs/llms.txt>

---

# 44. `/ultraplan`

## Purpose

`/ultraplan` creates an advanced planning workflow where a plan can be designed in an Ultraplan session, reviewed in the browser and then executed remotely or returned to the terminal.

Use for substantial tasks requiring explicit planning/review, not routine localized changes.

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/llms.txt>

---

# 45. Design Sync — `/design-sync`

## Purpose

`/design-sync` synchronizes a repository's React design system with Claude Design so visual design work can use the project's real components rather than generic approximations.

Conceptually:

```text
React repository
      |
      | /design-sync
      ↓
component discovery / verification
      ↓
Claude Design
      ↓
designs based on project components
```

## Authentication

Use:

```text
/design-login
```

to authorize design-system access with the relevant `claude.ai` account.

Then:

```text
/design-sync
```

or, where useful:

```text
/design-sync <hint>
```

The hint can help identify/name the design system.

## Best use cases

- React application with reusable components;
- existing design system;
- shadcn-like component layer;
- repeated visual iteration;
- UI-heavy project;
- reducing design-to-code translation.

## Low-value cases

- non-React project;
- no reusable component system;
- no Claude Design workflow;
- stable UI with little design iteration.

## First synchronization

The first sync may verify many components and can therefore be relatively expensive on a large repository.

Do not repeatedly perform complete initial synchronization without need.

## Design authority

The repository remains the implementation source of truth.

Claude Design is a visual/design workflow; Design Sync reduces the gap between design and implementation but does not replace:

- accessibility validation;
- responsive validation;
- application logic;
- tests;
- runtime verification.

## Feature availability

`/design-sync` is not available on every backend/provider/environment. Check feature availability before making a workflow depend on it.

## Documentation

- Commands: <https://code.claude.com/docs/en/commands>
- Feature availability: <https://code.claude.com/docs/en/feature-availability>
- Documentation index: <https://code.claude.com/docs/llms.txt>

---

# 46. Plugins

## Purpose

Plugins package reusable Claude Code extensions.

A plugin can bundle:

- Skills;
- subagents;
- hooks;
- MCP servers;
- LSP servers;
- monitors;
- executables;
- settings/configuration.

## Use when

A coherent extension must be reused across:

- multiple repositories;
- teams;
- distributed environments.

## Avoid

For one repository with one or two procedures, `.claude/` project configuration is usually simpler.

## Documentation

- Overview: <https://code.claude.com/docs/en/plugins>
- Reference: <https://code.claude.com/docs/en/plugins-reference>
- Marketplaces: <https://code.claude.com/docs/en/plugin-marketplaces>
- Features overview: <https://code.claude.com/docs/en/features-overview>

---

# 47. Plugin marketplaces

## Purpose

Plugin marketplaces provide centralized discovery, versioning and distribution of plugins.

Useful for:

- shared organizational tooling;
- versioned reusable workflows;
- distributing standardized agents/skills/hooks.

For solo/single-repo development, marketplace infrastructure is often unnecessary.

## Documentation

- <https://code.claude.com/docs/en/plugin-marketplaces>
- <https://code.claude.com/docs/en/plugins-reference>

---

# 48. LSP / code intelligence

## Purpose

Language Server Protocol integrations can provide semantic code navigation and diagnostics.

Potential capabilities:

- go-to-definition;
- references;
- diagnostics;
- symbol resolution;
- semantic navigation.

## Guidance

Prefer semantic tools when the question is semantic.

```text
"Where is this symbol defined?"
→ LSP/code intelligence

"Which files contain this exact string?"
→ text search
```

## Documentation

- <https://code.claude.com/docs/en/plugins-reference>
- <https://code.claude.com/docs/en/tools-reference>
- <https://code.claude.com/docs/llms.txt>

---

# 49. Claude Code with Chrome

## Purpose

Chrome integration enables browser interaction for frontend and web workflows.

Useful for:

- reproducing UI bugs;
- inspecting actual runtime behavior;
- verifying visual flows;
- testing authenticated applications;
- closing the loop between code and browser result.

## Principle

Browser validation complements deterministic tests.

Prefer:

```text
automated tests
+
browser verification when needed
```

rather than replacing all tests with visual inspection.

## Documentation

- <https://code.claude.com/docs/en/chrome>

---

# 50. Computer Use

## Purpose

In supported environments/versions, Claude Code can use graphical applications/computer interfaces to verify changes that cannot be fully tested through CLI/browser APIs.

Good for:

- native application testing;
- GUI-only workflows;
- final visual verification.

## Caution

Computer Use is more probabilistic and expensive than deterministic automation.

Use when no cheaper reliable mechanism exists.

## Documentation

- <https://code.claude.com/docs/en/whats-new>
- <https://code.claude.com/docs/en/feature-availability>
- <https://code.claude.com/docs/llms.txt>

---

# 51. VS Code / IDE integration

## Purpose

Claude Code integrates with IDEs to provide richer code context and editing/review workflows.

Potential benefits:

- inline diffs;
- editor context;
- file references;
- plan review;
- code navigation.

Treat the IDE as an interaction layer rather than project architecture.

## Documentation

- <https://code.claude.com/docs/en/ide-integrations>
- <https://code.claude.com/docs/en/platforms>

---

# 52. Claude Code on the Web

## Purpose

Claude Code can run in cloud environments through the web.

Useful when:

- local setup is unnecessary;
- working from phone/browser;
- running multiple tasks in parallel;
- operating on a GitHub repository remotely;
- generating/reviewing PRs without the local repository.

## Documentation

- <https://code.claude.com/docs/en/web-quickstart>
- <https://code.claude.com/docs/en/platforms>

---

# 53. Desktop

## Purpose

Desktop provides a graphical Claude Code environment and can support parallel sessions, local workflows, diffs, previews and integration with other Claude surfaces.

Treat Desktop as a working surface, not a reason to create project-specific infrastructure.

## Documentation

- <https://code.claude.com/docs/en/platforms>
- <https://code.claude.com/docs/llms.txt>

---

# 54. Remote Control

## Purpose

Remote Control exposes an existing local Claude Code session to supported Claude surfaces so it can be continued from another device.

Useful for:

- supervising long local work remotely;
- giving follow-up instructions from phone/tablet;
- continuing without moving the repository/environment.

The actual execution environment remains the local Claude Code environment.

## Documentation

- <https://code.claude.com/docs/en/remote-control>
- <https://code.claude.com/docs/en/commands>

---

# 55. Model configuration

## Purpose

Claude Code supports model selection and effort configuration.

Model choice should reflect the required reasoning depth.

### Tier 0 — deterministic

Do not use a model when code can answer exactly.

Examples:

- parse JSON;
- check schema;
- run compiler;
- compare IDs;
- validate file structure.

### Tier 1 — cheap reasoning

Use for:

- search;
- extraction;
- simple classification;
- inventory.

### Tier 2 — standard coding

Use for:

- ordinary implementation;
- debugging;
- focused refactoring.

### Tier 3 — strong reasoning

Reserve for:

- hard architecture;
- complex debugging;
- ambiguous algorithms;
- synthesis of conflicting evidence.

## Documentation

- <https://code.claude.com/docs/en/model-config>
- <https://code.claude.com/docs/en/commands>

---

# 56. `/model`

## Purpose

`/model` changes or inspects model configuration.

Switch intentionally.

Avoid unnecessary model switching during a task unless expected benefit outweighs disruption/cost.

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/model-config>

---

# 57. `/effort`

## Purpose

`/effort` configures reasoning effort where supported.

Higher effort should be used only when the problem benefits from deeper reasoning.

Low-value examples for high effort:

- rename variable;
- locate file;
- run tests.

High-value examples:

- architectural tradeoff;
- subtle race condition;
- difficult reverse engineering.

## Documentation

- <https://code.claude.com/docs/en/model-config>
- <https://code.claude.com/docs/en/commands>

---

# 58. Ultracode

## Purpose

Current Claude Code documentation describes Ultracode as a Claude Code setting that combines high model effort with dynamic-workflow orchestration rather than merely being another effort level.

Use only for work whose complexity justifies the additional orchestration and cost.

## Documentation

- <https://code.claude.com/docs/en/model-config>
- <https://code.claude.com/docs/en/workflows>
- <https://code.claude.com/docs/en/whats-new>

---

# 59. `/usage`

## Purpose

`/usage` helps inspect what is driving usage/limits.

Use it when optimizing quota consumption or understanding unexpectedly high model use.

Potential audit targets:

- large repeated context;
- too many agents;
- overly strong model for trivial tasks;
- repeated reviews;
- unnecessary cloud workflows.

## Documentation

- <https://code.claude.com/docs/en/commands>
- <https://code.claude.com/docs/en/whats-new>

---

# 60. Prompt caching and context reuse

## Principle

Stable prompt/context reuse can reduce repeated processing under applicable caching behavior.

Do not distort project architecture solely around caching.

Primary optimizations remain:

- concise persistent context;
- scoped rules;
- Skills;
- subagent isolation;
- fresh sessions when appropriate;
- avoiding repeated rediscovery.

## Documentation

- <https://code.claude.com/docs/en/how-claude-code-works>
- <https://code.claude.com/docs/llms.txt>

---

# 61. Error diagnostics

## Purpose

Differentiate:

```text
project/application error
```

from:

```text
Claude Code configuration/runtime/tooling error
```

Before creating workarounds for Claude Code behavior:

1. check error docs;
2. check changelog;
3. inspect version/configuration;
4. reproduce minimally.

## Documentation

- <https://code.claude.com/docs/en/errors>
- <https://code.claude.com/docs/en/changelog>

---

# 62. Feature availability

## Purpose

Not every Claude Code feature is available on every:

- plan;
- platform;
- backend/provider;
- environment;
- version.

Examples include design-related commands and experimental/cloud functions.

Any project workflow depending on a non-universal feature should record that dependency explicitly.

## Documentation

- <https://code.claude.com/docs/en/feature-availability>

---

# 63. Validation architecture

## Core principle

For every multi-stage pipeline:

```text
STEP N
   ↓
execute
   ↓
validate
   ↓
PASS?
 ├─ NO → diagnose → minimal correction → revalidate
 └─ YES → STEP N+1
```

Do not allow downstream stages to consume invalid output when validation can occur earlier.

## Preferred validation hierarchy

1. exact deterministic check;
2. schema;
3. parser;
4. compiler;
5. type checker;
6. linter/static analysis;
7. unit test;
8. integration test;
9. domain-specific validator;
10. structured comparison;
11. cheap model judgment;
12. strong-model judgment.

---

# 64. Choosing the correct Claude Code mechanism

## Persistent global knowledge

Use:

```text
CLAUDE.md
```

## Path/file-specific instructions

Use:

```text
.claude/rules/
```

## Reusable procedure

Use:

```text
Skill
```

## Large isolated investigation

Use:

```text
Subagent
```

## Guaranteed event-driven behavior

Use:

```text
Hook
```

## External structured integration

Use:

```text
MCP
```

## External push event into active session

Use:

```text
Channel
```

## Machine/tool restriction

Use:

```text
Permissions + sandbox
```

## Independent concurrent code changes

Use:

```text
Worktrees / parallel sessions
```

## Workers need direct coordination

Consider:

```text
Agent Team
```

## Large-scale orchestration

Consider:

```text
Dynamic Workflow
```

## Verifiable autonomous completion

Use:

```text
/goal
```

## Temporary repeated check

Use:

```text
/loop / scheduled task
```

## Durable recurring cloud automation

Use:

```text
Routine
```

## React design-system → Claude Design

Use:

```text
/design-sync
```

---

# 65. Complexity-control hierarchy

This is a heuristic, not an absolute technical rule:

```text
1. Existing deterministic code
2. Small deterministic script
3. Test / validator
4. CLAUDE.md / scoped rule
5. Hook
6. Skill
7. Main Claude Code agent
8. Subagent
9. Few subagents
10. Worktree parallelism
11. Agent Team
12. Dynamic Workflow / Ultracode
```

Use the least complex mechanism that reliably solves the problem.

---

# 66. Anti-patterns

## Huge `CLAUDE.md`

Problem:

- wastes context;
- weakens instruction salience;
- mixes concerns.

Prefer rules + Skills + dedicated project docs.

## LLM validation of deterministic facts

Bad:

```text
Ask Claude whether JSON is syntactically valid.
```

Better:

```text
Parse JSON.
```

## Expensive model for search

Bad:

```text
Use strongest model to list files.
```

Better:

```text
Use search tools or cheap subagent.
```

## Agent Team for sequential work

Bad:

```text
Five agents modify tightly coupled files.
```

Better:

```text
One agent performs atomic dependent changes.
```

## Custom infrastructure duplicating Claude Code

Before building:

- memory database;
- workflow loader;
- rollback layer;
- subagent coordinator;
- formatter trigger;
- scheduled polling framework;

verify whether Claude Code already provides:

- Auto Memory;
- Skills;
- checkpointing;
- subagents;
- Hooks;
- scheduled tasks;
- Dynamic Workflows.

## Excessive MCP

Every integration adds:

- security surface;
- configuration;
- tool-selection complexity.

Keep only integrations that create measurable value.

## Design system created only for `/design-sync`

Do not introduce a heavy design-system abstraction solely to use Design Sync.

The component layer should be independently justified.

---

# 67. Repository audit procedure

When using this document to audit a repository, do not modify files immediately.

## Phase 1 — Inventory

Locate:

```text
CLAUDE.md
CLAUDE.local.md
.claude/
.claude/rules/
.claude/skills/
.claude/agents/
settings files
hooks
MCP configuration
plugin configuration
scripts
CI workflows
PROJECT_BRIEF.md
DECISIONS.md
TASKS.md
```

Also inspect:

- package scripts;
- test commands;
- lint/typecheck;
- Git workflow;
- validators;
- design-system/component paths;
- recurring manual procedures.

---

# 68. Phase 2 — Classify information

Classify every major instruction/document section as:

```text
GLOBAL_PROJECT_RULE
SCOPED_RULE
REUSABLE_PROCEDURE
TEMPORARY_TASK_STATE
ARCHITECTURE_DECISION
PROJECT_SPECIFICATION
AGENT_MEMORY
DETERMINISTIC_VALIDATION
EXTERNAL_INTEGRATION
DESIGN_SYSTEM
```

Then place it in the most appropriate mechanism.

---

# 69. Phase 3 — Detect duplication

Search duplication between:

- `CLAUDE.md`;
- `PROJECT_BRIEF.md`;
- `DECISIONS.md`;
- `TASKS.md`;
- Skills;
- rules;
- prompts;
- scripts;
- code comments;
- Auto Memory.

Determine a source of truth before removing duplication.

---

# 70. Phase 4 — Detect probabilistic requirements

Search wording such as:

```text
always
must
never
after every
before proceeding
verify
make sure
do not continue until
```

For each, ask:

> Can this be enforced deterministically?

Potential migrations:

```text
instruction → validator
instruction → test
instruction → hook
instruction → permission
instruction → schema
```

---

# 71. Phase 5 — Detect Skill candidates

Look for procedures that:

- have multiple steps;
- are repeated;
- require specialized domain knowledge;
- are pasted into prompts;
- occupy many lines of global context.

Create a Skill only when expected reuse justifies maintenance.

---

# 72. Phase 6 — Detect subagent candidates

Look for recurring tasks involving:

- large searches;
- log analysis;
- broad exploration;
- independent research;
- independent review.

Ask whether context isolation saves more than delegation costs.

---

# 73. Phase 7 — Detect `/goal` candidates

Look for long-running tasks with explicit completion conditions:

- all tests pass;
- every generated artifact validates;
- zero unresolved references;
- build succeeds;
- N items processed and validated.

Use `/goal` only when completion can be evaluated clearly.

---

# 74. Phase 8 — Detect scheduling candidates

Classify repeated/time-based tasks:

```text
temporary while session is active
→ scheduled task / /loop

persistent cloud automation
→ Routine

external push event to active session
→ Channel
```

Avoid polling when event-driven mechanisms are available.

---

# 75. Phase 9 — Detect Design Sync opportunity

For React repositories inspect:

- `components/ui`;
- shared component directories;
- `packages/ui`;
- design tokens;
- component variants;
- Storybook or related component documentation.

Then ask:

1. Is there a coherent reusable component layer?
2. Is Claude Design used?
3. Does design-to-code translation currently waste time?
4. Would `/design-sync` reduce invented components?
5. Is the feature available in the current environment?

Classify Design Sync as optional unless it produces concrete UI workflow value.

---

# 76. Phase 10 — Detect quota waste

Look for:

- repeated repository rediscovery;
- expensive model used for simple search;
- IA validation replaceable by code;
- duplicated agents;
- agents reading identical context;
- repeated broad reviews;
- unnecessary large prompts;
- huge global context;
- excessive parallelism;
- unnecessary cloud review/workflow escalation.

For each opportunity estimate:

```text
expected benefit
implementation complexity
token/quota saving
reliability impact
maintenance cost
```

---

# 77. Phase 11 — Detect over-engineering

Reject proposals where:

```text
added complexity > expected recurring benefit
```

Examples:

- plugin for one tiny repo-local Skill;
- MCP wrapper around a simple CLI;
- Agent Team for a three-step sequential task;
- custom memory service replacing Auto Memory;
- Dynamic Workflow used twice per year;
- heavy design system created only for Design Sync.

---

# 78. Recommendation priority

Classify proposals:

## A — high gain / low complexity

Recommend first.

## B — clear gain / moderate complexity

Implement when usage frequency justifies it.

## C — marginal gain

Do not implement by default.

## D — over-engineering

Explicitly reject.

---

# 79. Recommendation report format

Use:

| Item | Current state | Problem | Claude Code capability | Proposed change | Expected gain | Complexity | Priority |
|---|---|---|---|---|---|---|---|

Do not change the repository before presenting the audit unless explicitly instructed.

---

# 80. Atomic implementation plan

After recommendations are approved, decompose work.

Every task must define:

```text
Objective
Files affected
Implementation
Validation
Success criterion
Rollback
```

Example:

```md
## Task 3 — Extract validation workflow into a Skill

Objective:
Remove specialized procedure from global context.

Files:
- CLAUDE.md
- .claude/skills/validate-model/SKILL.md

Validation:
- Skill is discoverable.
- CLAUDE.md no longer duplicates the procedure.
- Existing behavior remains correct.

Success criterion:
Claude can execute the procedure when relevant without carrying its full instructions in every session.
```

---

# 81. Atomic execution principle

Prefer:

```text
change
 ↓
validate
 ↓
checkpoint/commit
 ↓
next change
```

over:

```text
rewrite many systems
 ↓
validate everything at the end
```

Every change should remain easy to:

- understand;
- test;
- revert;
- review.

---

# 82. Documentation-source hierarchy

When reasoning about Claude Code itself:

1. current official page for the capability;
2. `llms.txt` documentation index;
3. feature-availability page;
4. current changelog / What's New;
5. observed behavior of installed Claude Code version.

Do not rely on remembered product behavior for fast-changing features.

---

# 83. Capability verification rule

Before implementing infrastructure around an assumed Claude Code limitation:

1. search <https://code.claude.com/docs/llms.txt>;
2. read the relevant current page;
3. check feature availability;
4. check version/changelog if needed;
5. inspect installed configuration;
6. determine whether native capability already solves it;
7. only then design a custom solution.

---

# 84. Global optimization objective

Optimize for:

```text
Reliability
+
Simplicity
+
Maintainability
+
Context efficiency
+
Low quota/model cost
+
Short feedback loops
```

Not for:

```text
Maximum number of Claude Code features used
```

---

# 85. Final operating rule

For each workflow decision:

```text
Can deterministic code solve it?
        |
       YES
        ↓
Use deterministic code.

       NO
        ↓
Is it persistent project knowledge?
        |
       YES
        ↓
CLAUDE.md / rule.

       NO
        ↓
Is it a reusable procedure?
        |
       YES
        ↓
Skill.

       NO
        ↓
Must it run automatically on an event?
        |
       YES
        ↓
Hook.

       NO
        ↓
Does it need isolated reasoning?
        |
       YES
        ↓
Subagent.

       NO
        ↓
Main Claude Code agent.

Does it require independent parallel workers?
        |
       YES
        ↓
Worktrees / Agent View / Agent Team.

Does it require large-scale orchestration?
        |
       YES
        ↓
Dynamic Workflow.

Does it have a verifiable autonomous endpoint?
        |
       YES
        ↓
/goal.

Is it temporary repeated monitoring?
        |
       YES
        ↓
Scheduled task / /loop.

Is it persistent cloud automation?
        |
       YES
        ↓
Routine.
```

The desired architecture is the **smallest set of mechanisms that produces reliable, repeatable results**.

---

# Appendix A — Official documentation index by capability

| Capability | Official documentation |
|---|---|
| Overview | <https://code.claude.com/docs/en/overview> |
| Documentation map | <https://code.claude.com/docs/en/claude_code_docs_map> |
| Complete LLM index | <https://code.claude.com/docs/llms.txt> |
| Features overview | <https://code.claude.com/docs/en/features-overview> |
| Tools reference | <https://code.claude.com/docs/en/tools-reference> |
| How Claude Code works | <https://code.claude.com/docs/en/how-claude-code-works> |
| Best practices | <https://code.claude.com/docs/en/best-practices> |
| Common workflows | <https://code.claude.com/docs/en/common-workflows> |
| Commands | <https://code.claude.com/docs/en/commands> |
| CLI reference | <https://code.claude.com/docs/en/cli-reference> |
| Memory / CLAUDE.md | <https://code.claude.com/docs/en/memory> |
| `.claude` directory | <https://code.claude.com/docs/en/claude-directory> |
| Skills | <https://code.claude.com/docs/en/skills> |
| Subagents | <https://code.claude.com/docs/en/sub-agents> |
| Parallel agents | <https://code.claude.com/docs/en/agents> |
| Agent Teams | <https://code.claude.com/docs/en/agent-teams> |
| Dynamic Workflows | <https://code.claude.com/docs/en/workflows> |
| Hooks guide | <https://code.claude.com/docs/en/hooks-guide> |
| Hooks reference | <https://code.claude.com/docs/en/hooks> |
| Permissions | <https://code.claude.com/docs/en/permissions> |
| Permission modes | <https://code.claude.com/docs/en/permission-modes> |
| Settings | <https://code.claude.com/docs/en/settings> |
| Environment variables | <https://code.claude.com/docs/en/env-vars> |
| Sandboxing | <https://code.claude.com/docs/en/sandboxing> |
| MCP | <https://code.claude.com/docs/en/mcp> |
| Channels | <https://code.claude.com/docs/en/channels> |
| Checkpointing / rewind | <https://code.claude.com/docs/en/checkpointing> |
| Goal | <https://code.claude.com/docs/en/goal> |
| Scheduled tasks / loop | <https://code.claude.com/docs/en/scheduled-tasks> |
| Routines | <https://code.claude.com/docs/en/routines> |
| Headless | <https://code.claude.com/docs/en/headless> |
| Agent SDK overview | <https://code.claude.com/docs/en/agent-sdk/overview> |
| Agent SDK quickstart | <https://code.claude.com/docs/en/agent-sdk/quickstart> |
| Agent SDK TypeScript | <https://code.claude.com/docs/en/agent-sdk/typescript> |
| Agent SDK system prompts | <https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts> |
| Agent SDK hooks | <https://code.claude.com/docs/en/agent-sdk/hooks> |
| GitHub Actions | <https://code.claude.com/docs/en/github-actions> |
| GitLab CI/CD | <https://code.claude.com/docs/en/gitlab-ci-cd> |
| Code review | <https://code.claude.com/docs/en/code-review> |
| Plugins | <https://code.claude.com/docs/en/plugins> |
| Plugins reference | <https://code.claude.com/docs/en/plugins-reference> |
| Plugin marketplaces | <https://code.claude.com/docs/en/plugin-marketplaces> |
| Chrome | <https://code.claude.com/docs/en/chrome> |
| IDE integrations | <https://code.claude.com/docs/en/ide-integrations> |
| Web quickstart | <https://code.claude.com/docs/en/web-quickstart> |
| Platforms | <https://code.claude.com/docs/en/platforms> |
| Remote Control | <https://code.claude.com/docs/en/remote-control> |
| Model configuration | <https://code.claude.com/docs/en/model-config> |
| Feature availability | <https://code.claude.com/docs/en/feature-availability> |
| Errors | <https://code.claude.com/docs/en/errors> |
| What's new | <https://code.claude.com/docs/en/whats-new> |
| Changelog | <https://code.claude.com/docs/en/changelog> |
| Glossary | <https://code.claude.com/docs/en/glossary> |

---

# Appendix B — Important commands to verify in current docs

The exact command set depends on version/platform/plan.

Always verify here:

<https://code.claude.com/docs/en/commands>

Important workflow commands include categories such as:

```text
/design-login
/design-sync
/effort
/goal
/loop
/memory
/model
/permissions
/remote-control
/review
/rewind
/ultraplan
/ultrareview
/usage
```

Do not infer exact syntax from this summary if the live command reference differs.

---

# Appendix C — Before creating custom Claude infrastructure

Before building a new component, check:

- [ ] Is this already a built-in Claude Code feature?
- [ ] Could deterministic code solve it?
- [ ] Could a test or validator solve it?
- [ ] Could a Hook solve it?
- [ ] Could a scoped rule solve it?
- [ ] Could a Skill solve it?
- [ ] Could one subagent solve it?
- [ ] Could `/goal` provide the required iteration?
- [ ] Is a scheduled task enough?
- [ ] Does it really need a Routine?
- [ ] Is MCP necessary, or is a CLI simpler?
- [ ] Do workers actually need to communicate?
- [ ] Is parallelism worth the quota?
- [ ] Does this reduce context consumption?
- [ ] Does this improve deterministic validation?
- [ ] Does this simplify maintenance?
- [ ] Is the feature available on the current platform/provider?
- [ ] Has the current official documentation been checked?

---

# Appendix D — Design Sync audit checklist

For React/UI projects:

- [ ] Locate reusable component directories.
- [ ] Identify whether a coherent design system exists.
- [ ] Determine whether Claude Design is part of the workflow.
- [ ] Verify `/design-sync` availability.
- [ ] Run `/design-login` if needed.
- [ ] Avoid duplicate UI primitives.
- [ ] Keep repository components as implementation source of truth.
- [ ] Validate accessibility separately.
- [ ] Validate responsive behavior separately.
- [ ] Validate runtime behavior with tests/browser tools.
- [ ] Do not create a design-system abstraction solely to use Design Sync.

---

# Appendix E — Freshness note

Claude Code evolves rapidly.

When this document conflicts with current official documentation:

> **Current official Claude Code documentation wins.**

Primary discovery endpoint:

<https://code.claude.com/docs/llms.txt>

Then verify:

<https://code.claude.com/docs/en/commands>

<https://code.claude.com/docs/en/feature-availability>

<https://code.claude.com/docs/en/whats-new>

<https://code.claude.com/docs/en/changelog>
