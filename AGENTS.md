# AGENTS.md — Rules for AI coding assistants

> This file applies to **every AI coding assistant** working in this repository —
> Claude Code, Cursor, GitHub Copilot, Windsurf, Cody, Gemini, Aider, and any other.
> `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/` all point here.

---

## 🔒 RULE #1 — NEVER COMMIT SECRETS (highest priority, no exceptions)

Do **not** stage, commit, or push any secret or credential — ever. This includes:

- API keys / access tokens
- OAuth **client secrets** (e.g. `GOCSPX-…`), Google API keys (`AIza…`), AWS keys (`AKIA…`)
- Private keys, `.pem`/`.key` files, certificates
- Any password

### Files that must stay OUT of git (already gitignored — keep it that way)
- `.env`, `.env.production`, and any `.env.*` (real values)

Only the **`*.example` templates** (`.env.example`, `.env.production.example`) belong in git,
and they must contain **placeholders only** (`<FILL>`, etc.) — never real values.

> Note: `VITE_*` values are baked into the public browser bundle, so OAuth **client IDs**
> are not secret. But OAuth **client secrets**, API keys, and passwords must NEVER appear
> in this frontend repo at all — they belong in the backend.

---

## ✅ How to add configuration the safe way
1. Put real values in the **gitignored** `.env` / `.env.production`.
2. When you add a new `VITE_*` key, add a **placeholder** entry to `.env.example` and
   `.env.production.example` so others know it exists.

## ✅ Before EVERY commit
- Review `git diff --staged` and look for anything secret-looking.
- **Never** run `git add -A` / `git add .` blindly — stage explicit paths.
- Never delete `.gitignore` entries that protect `.env` files.

## 🚨 If a secret gets committed by accident
1. STOP. Deleting it in a new commit is **not enough** — it stays in git history.
2. Treat it as compromised → **rotate/regenerate** it at the provider immediately.
3. Purge it from history: `git filter-repo --path <file> --invert-paths` then force-push.
