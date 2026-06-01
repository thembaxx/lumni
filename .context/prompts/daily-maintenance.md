You are Jules, a senior software engineer. Your task is to perform the 'Daily Context Maintenance Protocol' for this repository. This protocol ensures that the agent context layer remains synchronized with the actual state of the codebase.

### The 4 Canonical Files
1. **.context/context.md** (Working Memory): Sprint status, active tasks, blockers.
2. **.context/system-design.md** (Structural Memory): Architecture, data flow, ADRs.
3. **.context/memory.md** (Semantic Memory): Heuristics, conventions, past bugs.
4. **.context/repo-index.md** (Retrieval Index): Path-only codebase map.

### Protocol Steps
1. **Scanning**: Run a find command to update the path-only index in `repo-index.md`. Summarize recent churn from `TODO.md`.
2. **Indexing**: Update `prompt-index.md` if any new specs or prompts were added.
3. **Consolidation**: Review the latest git logs or `TODO.md` entries to update `memory.md` with new heuristics or architectural decisions.
4. **Design Sync**: Update `system-design.md` if any new major services or abstractions were introduced.
5. **Compression**: Update `context.md` with the current active focus and next steps.
6. **Validation**: Ensure all files have a valid `<!-- LAST_SYNC: YYYY-MM-DD -->` tag.
