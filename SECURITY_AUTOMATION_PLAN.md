# Security Automation Plan

Status: **not executed**. This document describes how to keep dependency vulnerabilities
patched without breaking the live site. Nothing here is committed or enabled yet.

Owner: Marketing Tusk Healthcare (Hostinger Node.js deployment)
Created: 2026-11-25

---

## 1. Current state (verified facts)

| Item | Value |
|---|---|
| Hosting | Hostinger Node.js app, `amusing-royalblue-fox-31.hostingersite.com` |
| Node version | 24 (set in Hostinger build settings) |
| Framework | Next.js 16.4.6, React 19.2.9 |
| Build | Hostinger runs `npm install` then `npm run build`; entry `next start` |
| Deploy trigger | **Every push to `main` deploys to production automatically** |
| CI | None |
| Staging | None (two spare WordPress subdomains exist on the account) |
| Database | MySQL on the same server; connect via `127.0.0.1`, names are prefixed `u977270314_` |
| Dependency style | Framework packages pinned exactly, others use `^` ranges, lockfile committed |
| `.npmrc` | `audit=false` (suppresses install-time audit only; `npm audit` still works) |

The risk this plan addresses: a dependency update can reach production with no build,
test, or smoke check in between, and the only signal is Hostinger's post-deploy scan.

## 2. Goals and non-goals

**Goals**

1. Every critical/high advisory gets a fix PR within one business day.
2. No dependency change reaches `main` without passing build, tests, and a runtime smoke test.
3. Major-version bumps never auto-merge.
4. A bad deploy can be reverted in minutes.
5. New advisories are detected even when nobody is looking.

**Non-goals**

- Fully hands-off major upgrades.
- Replacing Hostinger's scanner (it stays as the second opinion).
- Application-level security review (auth, CSRF, secrets rotation).

---

## 3. Phase 0 - prerequisites (about 15 minutes)

- [ ] Confirm the GitHub account with write access to `mtforstartups-hub/healthcare-mt`
      is the one used for pushing (the local credential is `pritam1813`, which is denied).
- [ ] Enable branch protection on `main`: require the `verify` check, no direct pushes.
- [ ] Create a `staging` branch from `main`.
- [ ] Decide whether to use Renovate or Dependabot (Renovate recommended: it understands
      `vulnerabilityAlerts`, grouping, and release-age delays).

---

## 4. Phase 1 - CI gate (about 1 hour)

Create `.github/workflows/verify.yml`. This must pass before anything merges.

```yaml
name: verify
on:
  pull_request:
  push:
    branches: [main, staging]

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.4
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: site
          MYSQL_USER: site
          MYSQL_PASSWORD: site
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1 -usite -psite"
          --health-interval=5s --health-timeout=5s --health-retries=20
    env:
      PORT: '3000'
      APP_ORIGIN: http://127.0.0.1:3000
      DB_HOST: 127.0.0.1
      DB_PORT: '3306'
      DB_USER: site
      DB_PASSWORD: site
      DB_NAME: site
      # Test-only values. Never reuse production secrets.
      ADMIN_SESSION_SECRET: '0000000000000000000000000000000000000000000000000000000000000001'
      INTAKE_ENCRYPTION_KEY: '0000000000000000000000000000000000000000000000000000000000000002'
      GOOGLE_CLIENT_ID: test.apps.googleusercontent.com
      GOOGLE_CLIENT_SECRET: test-secret
      GOOGLE_ALLOWED_DOMAIN: marketingtusk.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      # Blocking: runtime dependencies only.
      - run: npm audit --omit=dev --audit-level=high
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
      - name: Import schema
        run: mysql -h 127.0.0.1 -usite -psite site < hostinger/schema.sql
      - name: Smoke test
        run: |
          set -euo pipefail
          npm start &
          for i in $(seq 1 40); do
            curl -sf http://127.0.0.1:3000/ >/dev/null && break
            sleep 1
          done
          check() { code=$(curl -s -o /dev/null -w '%{http_code}' "$1"); \
            echo "$1 -> $code"; [ "$code" = "$2" ] || exit 1; }
          check / 200
          check /services 200
          check /contact 200
          check /blog 200
          check /sitemap.xml 200
          check /studio 200
          check /api/studio 403
          check /api/auth/google/start 303
```

Notes

- `npm audit --omit=dev` blocks on runtime risk. Dev-only advisories should warn, not block,
  or the pipeline will stall on tooling noise.
- The MySQL service makes the DB-backed routes (`/blog`, forms) real checks instead of skips.
- The smoke test asserts `/studio` is 200 and `/api/studio` is 403, i.e. the auth gate still works.

Acceptance: a deliberately broken build fails CI; a passing build shows all routes 200.

---

## 5. Phase 2 - Renovate (about 30 minutes)

Add `renovate.json` at the repo root:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":dependencyDashboard"],
  "minimumReleaseAge": "3 days",
  "rangeStrategy": "pin",
  "osvVulnerabilityAlerts": true,
  "vulnerabilityAlerts": {
    "enabled": true,
    "minimumReleaseAge": "1 day"
  },
  "packageRules": [
    {
      "matchPackageNames": ["next", "eslint-config-next"],
      "groupName": "next"
    },
    {
      "matchPackageNames": ["react", "react-dom", "react-server-dom-webpack"],
      "groupName": "react"
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false
    },
    {
      "matchPackageNames": ["zod"],
      "automerge": false
    },
    {
      "matchDepTypes": ["dependencies", "devDependencies"],
      "matchUpdateTypes": ["patch", "pin"],
      "automerge": true
    }
  ]
}
```

Why these rules

- **Grouping matters.** `next` and `eslint-config-next` must move together, and
  `react`, `react-dom`, `react-server-dom-webpack` are peer-locked: bumping the RSC package
  alone to 19.3.1 demands React `^19.3.1` and fails to install.
- **`minimumReleaseAge: 3 days`** is a supply-chain buffer. It costs nothing and stops a
  freshly hijacked release from reaching the site.
- **Exact pins for the framework** preserve the project's existing convention, so a range
  cannot silently drift during Hostinger's `npm install`.
- **Majors never auto-merge.** zod 3 -> 4 is the example: the advisory's fix was a major.

Acceptance: Renovate opens one grouped PR for a React patch, CI runs, and it auto-merges only
after green.

---

## 6. Phase 3 - Staging target (about 2-3 hours)

Without this, `main` is the first environment a build ever runs in.

1. Create a new Node.js website on a subdomain (e.g. `staging-<project>.hostingersite.com`).
   Do not convert an existing WordPress site in place; create a fresh app.
2. Connect the same repository, branch `staging`, same build settings (Node 24, `npm run build`).
3. Copy the environment variables, changing:
   - `APP_ORIGIN` to the staging origin
   - a **separate** `ADMIN_SESSION_SECRET` and `INTAKE_ENCRYPTION_KEY` (or a separate database)
4. Add the staging redirect URI to the same Google OAuth client:
   `https://<staging-origin>/api/auth/google/callback`
5. Flow becomes: Renovate PR -> CI -> merge to `staging` -> auto-deploy -> live smoke test ->
   merge to `main`.

Live smoke test (run after each staging deploy):

```bash
base=https://<staging-origin>
for path in / /services /contact /blog /studio /sitemap.xml; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$base$path")
  echo "$code $path"; [ "$code" = 200 ] || exit 1
done
```

Acceptance: a staging deploy can fail without touching production.

---

## 7. Phase 4 - Scheduled detection (about 30 minutes)

Two independent detectors, because they disagree in useful ways.

1. **Hostinger scanner** (knows fix versions and whether a one-click patch exists):
   `hosting_nodejs_list-vulnerabilities` for the domain. It already caught advisories that
   `npm audit` did not surface as clearly, and it marked zod `is_patchable: false`.
2. **`npm audit`** in CI (catches transitive and dev-tree issues).

Automation options, pick one:

- **OpenCode automation (available now):** a weekly cron that calls the Hostinger MCP tool
  and only reports when a *new* critical/high appears. No infrastructure needed.
- **GitHub Action cron** that calls the Hostinger REST API with a scoped token stored as a
  repository secret, then opens an issue on new findings.

Acceptance: a new advisory produces a notification without anyone checking manually.

---

## 8. Patch runbook (use every time Hostinger reports something)

1. **Read the advisory, not just the package name.** Check `fix_version`, `severity`,
   `is_patchable`, and whether the vulnerable code path is actually used
   (`git grep "from '<package>'"`). An unused package is best removed, not upgraded.
2. **Check peer constraints before installing:**
   `npm view <package>@<fix> peerDependencies`.
3. **Prefer the smallest safe jump:** patched patch line first (19.2.9), not the newest
   major (19.3.1), when peers allow it.
4. **Apply and verify locally:**
   ```bash
   npm install <package>@<fix>
   npm ls <package>            # must show ONE copy at the fixed version
   npm audit                   # must report 0
   npx tsc --noEmit && npm test && npm run build
   ```
5. **Confirm the scanner will agree:** remove nested duplicate copies; `npm ls <package>`
   showing a deduped single version is the signal.
6. **Ship:** PR -> CI -> staging -> main. Never straight to `main`.
7. **Re-run the Hostinger scan after deploy** and confirm the finding is gone.

Decision shortcuts

- *Unused direct dependency* -> remove it (`npm uninstall`). Fewer packages, no advisory.
- *Major bump required* -> treat as a migration: read the changelog, grep usage, adapt,
  build, test. Never auto-merge.
- *Transitive only* -> `npm audit fix` first; if it cannot resolve, use `overrides` and
  verify with `npm ls`.

---

## 9. Rollback

- Revert the offending commit and push: `git revert <sha> && git push`. This triggers a
  rebuild of the previous source.
- Hostinger keeps versioned builds; the deployment log shows the active version UUID, so a
  bad release can be identified precisely.
- Database changes are not part of dependency bumps; if a release did touch schema, restore
  from the pre-deploy backup before reverting code.

Target: under 10 minutes from "site is broken" to "previous version serving".

---

## 10. Known pitfalls (learned the hard way on this project)

| Pitfall | Symptom | Fix |
|---|---|---|
| `SameSite=Strict` on the OAuth session cookie | After Google sign-in, `/studio` still shows the sign-in button until manual refresh | Use `SameSite=Lax`; the return from Google is a cross-site navigation |
| Hostinger DB name/user prefix | `Access denied for user ... (using password: YES)`; login 503, `/blog` 500 | Use `u<account>_` prefixed names and `DB_HOST=127.0.0.1` |
| React RSC peer lockstep | `ERESOLVE` on `react-server-dom-webpack` | Bump `react`, `react-dom`, and the RSC package together |
| Framework ranges instead of pins | Version drifts between local and Hostinger builds | Keep exact pins for `next`/`react`/`react-dom` |
| `sharp` behind an advisory | Image Optimization RCE workaround unmet | Upgrade `next`; verify `npm ls sharp` >= 0.35.5 |
| Dev-only advisories blocking CI | Pipeline stuck on tooling noise | Block on `--omit=dev`, warn on the rest |

---

## 11. Acceptance checklist

- [ ] Branch protection on `main` requires the `verify` workflow
- [ ] `verify` runs `npm ci`, audit, typecheck, tests, build, schema import, smoke test
- [ ] Renovate groups `next` and `react` families; majors never auto-merge
- [ ] `minimumReleaseAge` >= 3 days for ordinary updates
- [ ] Staging app deploys from `staging` and is smoke-tested before `main`
- [ ] Weekly scan reports new critical/high advisories
- [ ] Rollback drill performed once (revert a trivial commit, confirm redeploy)
- [ ] A patch bump of a real advisory completed end-to-end through the pipeline

## 12. Effort estimate

| Phase | Effort | Blocking? |
|---|---|---|
| 0 - prerequisites | 15 min | yes |
| 1 - CI gate | 1 h | yes |
| 2 - Renovate | 30 min | yes |
| 3 - staging | 2-3 h | recommended |
| 4 - scheduled scan | 30 min | optional |
| Runbook drill | 30 min | yes |

Minimum viable version (phases 0-2): about 2 hours, and it already prevents the
"deploy a broken dependency straight to production" failure mode.
