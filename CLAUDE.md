# CLAUDE.md

See **[AGENTS.md](./AGENTS.md)** for the full policy.

## 🔒 Most important rule: NEVER commit secrets
Real values (API keys, OAuth client secrets, passwords) live **only** in gitignored
`.env` / `.env.production`. Only `*.example` templates with placeholders go in git.
OAuth **client IDs** in `VITE_*` are public (baked into the bundle) and OK; client
**secrets**/keys must never be in this frontend repo — they belong in the backend.
Review `git diff --staged` before committing; never `git add -A` blindly.
