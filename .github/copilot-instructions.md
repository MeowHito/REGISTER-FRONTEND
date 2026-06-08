# GitHub Copilot instructions

Full policy: **[AGENTS.md](../AGENTS.md)**.

## 🔒 Most important rule: NEVER commit secrets
Never put real API keys, OAuth client secrets, or passwords into committed files.
Real values belong only in gitignored `.env` / `.env.production`; only `*.example`
templates with placeholders are committed. OAuth client IDs in `VITE_*` are public and
OK, but client secrets/keys must never be in this frontend repo (they belong in the
backend). Do not suggest `git add -A`; stage explicit paths and review the diff first.
