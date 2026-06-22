# Workflow: TODO.md ↔ Linear ↔ GitHub ↔ Sentry

## Overview

```
TODO.md ──sync──▶ Linear ───native──▶ GitHub
                     ▲
Sentry ───native─────┘
```

Three integrated systems for tracking work, bugs, and errors.

---

## 1. TODO.md → Linear (One-Way Push)

A TSX script at `scripts/sync-todo-to-linear.ts` pushes TODO.md changes to Linear.

### How it works

| TODO.md annotation            | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `<!-- linear-id: LUM-42 -->`  | Links a task to its Linear issue              |
| `<!-- linear-priority: N -->` | Section-level priority (`2`=High, `3`=Normal) |
| `- [ ]` / `- [x]`             | Maps to Linear state: Backlog / Done          |

### Running

```bash
npm run todo:sync
```

The script:

1. Parses every checklist item in TODO.md
2. Items **with** a `linear-id` → updates title, priority, and state in Linear
3. Items **without** a `linear-id` → creates a new Linear issue, writes the ID back into TODO.md
4. Unchecked → **Backlog**; Checked → **Done**

### Adding new tasks

1. Write `- [ ] **Task name** — description` in TODO.md
2. Run `npm run todo:sync`
3. The script creates the Linear issue and embeds the ID

---

## 2. Linear ↔ GitHub (Native Integration)

Linear has a built-in GitHub integration. Install the **Linear GitHub app** from:

```
Linear App → Settings → Integrations → GitHub
```

### What it enables

| Trigger                            | Action                           |
| ---------------------------------- | -------------------------------- |
| Branch created from Linear         | Auto-named `lum-42-task-name`    |
| PR with `LUM-42` in branch/PR body | Links PR to Linear issue         |
| PR merged with "Closes LUM-42"     | Moves Linear issue → **Done**    |
| Linear issue → In Progress         | Creates GitHub branch (optional) |

### Branch naming convention

```
LUM-<number>-<kebab-description>
```

Example: `LUM-2-live-pdf-scraper`

### PR conventions

- Include `Closes LUM-42` in the PR description to auto-close the issue on merge
- Reference `LUM-xxx` in commit messages for two-way linking

---

## 3. Sentry → Linear (Native Integration)

Sentry has a built-in Linear integration. Configure at:

```
Sentry → Settings → Integrations → Linear → Connect Workspace
```

### What it does

| Threshold                | Action                              |
| ------------------------ | ----------------------------------- |
| New error group          | Auto-creates Linear bug (Bug label) |
| 10 users affected        | Triggers issue creation             |
| Error reoccurs after fix | Reopens Linear issue                |

### Setup steps

1. **Navigate** to `sentry.io` → **Settings** → **Integrations** → **Linear**
2. **Click "Connect Workspace"** → authorise with your Linear account in the popup
3. **Select project**: Pick the **Lumni (LUM)** team from the dropdown
4. **Configure thresholds** (defaults are sane, but review):

   | Setting                         | Recommended | Notes                               |
   | ------------------------------- | ----------- | ----------------------------------- |
   | Create issue on new error group | ✅ Enabled  | Auto-creates LUM-xxx bug            |
   | Minimum users affected          | `10`        | Avoids noise from isolated errors   |
   | Reopen when error reoccurs      | ✅ Enabled  | Reopens a Done issue                |
   | Label                           | `Bug`       | Applies the Bug label automatically |

5. **Save** the configuration

### After setup

Verify by triggering a test error in production or staging. Within ~5 minutes a new `LUM-xxx` issue should appear in the Linear Backlog with:

- Sentry error title as the issue title
- Stack trace in the description
- Environment, release version, user count
- **Bug** label applied
- Link back to the Sentry issue

### Troubleshooting

| Issue                             | Fix                                                                    |
| --------------------------------- | ---------------------------------------------------------------------- |
| No issues created after errors    | Check Sentry → Settings → Integrations → Linear → Activity Log         |
| Wrong Linear team                 | Disconnect and reconnect, selecting the correct team                   |
| Duplicate issues                  | Linear deduplicates by default — check if errors are grouped in Sentry |
| Issues created but no stack trace | Ensure source maps are uploaded in the CI `sentry-release` job         |

Every new error that reaches the threshold auto-creates a `LUM-xxx` issue with:

- Stack trace in the description
- Environment, release, and user count
- "Bug" label applied

---

## 4. Sentry → GitHub (Manual via Sentry comments)

Sentry can also comment on GitHub issues/PRs when a deploy includes a fix for a tracked error:

```
Sentry → Settings → Integrations → GitHub → Configure
```

This is **optional** — no urgent need until you have Sentry releases wired up.

---

## Linear Configuration

| Setting         | Value                                           |
| --------------- | ----------------------------------------------- |
| Team            | **Lumni (LUM)**                                 |
| Team ID         | `86d9eadf-8428-4e38-8bdf-4028e66e0037`          |
| Project ID      | `6eaef6d1-6e88-4ca9-8f61-b34ba2d099d7`          |
| Workflow states | Backlog → Todo → In Progress → In Review → Done |
| Labels          | Bug, Feature, Improvement                       |

### Issue numbering

```
LUM-1   Replace Vercel domain
LUM-2   Live PDF scraper
...
LUM-20  Component tests
```

---

## CI: GitHub Actions

The repo has four CI jobs in `.github/workflows/ci.yml`:

| Job              | Runs on           | Purpose                         |
| ---------------- | ----------------- | ------------------------------- |
| `quality`        | PR + push to main | tsc, biome, test, build         |
| `bundle-size`    | PR + push to main | Build with analyzer             |
| `todo-sync`      | Push to main only | `npm run todo:sync` after merge |
| `sentry-release` | Push to main only | Create Sentry release           |

### Required GitHub secrets

| Secret              | Purpose                          | Value                                                                                             |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `LINEAR_API_KEY`    | For the `todo-sync` job          | Set via CI secret                                                                                 |
| `SENTRY_DSN`        | Enables Sentry source map upload | `https://9863412a95109b4e994c4d30aaac7266@o4510925914963968.ingest.us.sentry.io/4511435431215104` |
| `SENTRY_AUTH_TOKEN` | For the `sentry-release` job     | Create in Sentry → Settings → Auth Tokens                                                         |

### Required GitHub variables

| Variable         | Purpose             | Value     |
| ---------------- | ------------------- | --------- |
| `SENTRY_ORG`     | Sentry org slug     | `org1128` |
| `SENTRY_PROJECT` | Sentry project slug | `lumni`   |

### Setting them up

```
GitHub → repo → Settings → Secrets and variables → Actions
```

Add the three **secrets** (encrypted).
Add the two **variables** (not secrets — they're non-sensitive).

### Checking it works

After adding DSN to `.env.local`:

1. Run `npm run dev` locally
2. Trigger an error (visit a broken route)
3. Check sentry.io → lumni project → Issues

After first deploy with the GitHub secrets set:

1. Merge a PR to main
2. The `sentry-release` job creates a release
3. Sentry links errors to that release

---

---

## 5. Workflow Rhythm

### Daily

1. **Check Sentry issues** → any new errors auto-create Linear bugs (once Sentry ↔ Linear is connected)
2. **Scan Linear Backlog** → drag unassigned items to Todo if they're actionable
3. **Update TODO.md** → add/check off items as you work
4. **Run `npm run todo:sync`** → pushes TODO.md state to Linear (optional daily, but do before a PR)

### Weekly

1. **Review Sentry → Linear bugs** → triage new issues, assign priority
2. **Prioritise Backlog** → move P2 items to "Next Up" in TODO.md, push lower to P3
3. **Sync TODO.md → Linear** → `npm run todo:sync` ensures Linear reflects your plan
4. **Check CI** → verify GitHub Actions secrets are set, `todo-sync` job ran on last merge

### Starting new work

```
1. Add task to TODO.md under "Next Up" or "Bug Fixes"
2. Run `npm run todo:sync` → creates Linear issue
3. Linear automatically creates a LUM-xxx branch when moved to In Progress
4. Commit with "LUM-xxx" in the message for auto-linking
5. PR description includes "Closes LUM-xxx"
6. Merge → Linear issue → Done, Sentry release created
```

### Receiving a bug report

```
1. Bug → TODO.md under "Bug Fixes" section
2. `npm run todo:sync` → Linear bug ticket
3. Fix → branch → PR → merge
4. Sentry release automatically deploys
5. Error reoccurs? Sentry reopens the Linear issue
```

---

## Linear API Key

The API key is hardcoded in `scripts/sync-todo-to-linear.ts` for convenience. To use an environment variable instead:

```bash
# .env.local or export
LINEAR_API_KEY=lin_api_xxx
```

The script falls back to the hardcoded key if the env var is not set.
