# Documentation Reorganization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the project documentation so README stays user-facing and detailed docs live under `docs/` for users and maintainers.

**Architecture:** Keep `README.md` as a concise entry point, add a docs index, and split detailed content into user, development, implementation, and troubleshooting guides. Use real file paths, scripts, and runtime behavior from the current repository.

**Tech Stack:** Markdown, npm scripts, existing project structure.

---

## Chunk 1: Documentation structure

### Task 1: Create the documentation directory layout

**Files:**
- Create: `docs/README.md`
- Create: `docs/user-guide.md`
- Create: `docs/development.md`
- Create: `docs/implementation/sharedworker-compat.md`
- Create: `docs/troubleshooting.md`
- Create: `docs/superpowers/plans/2026-03-31-documentation-reorg.md`

- [ ] Create the `docs/` directory tree
- [ ] Create the user guide, development guide, implementation note, and troubleshooting files
- [ ] Add an index file for document navigation

### Task 2: Rewrite the top-level README

**Files:**
- Modify: `README.md`

- [ ] Replace the oversized mixed-content README with a concise product entry point
- [ ] Keep install, quick start, plugin usage, and command overview
- [ ] Link out to detailed docs instead of duplicating the content

## Chunk 2: Content validation

### Task 3: Align docs with the actual repository

**Files:**
- Modify: `README.md`
- Modify: `docs/*.md`

- [ ] Check `package.json`, examples, scripts, and public API type definitions
- [ ] Use real commands and file paths in all examples
- [ ] Explain the current SharedWorker, Worker, and fallback architecture accurately

### Task 4: Verify the documentation entry points

**Files:**
- Modify: `README.md`
- Modify: `docs/README.md`

- [ ] Verify links between README and docs
- [ ] Verify document names and relative paths
- [ ] Verify that the docs are split by audience as designed
