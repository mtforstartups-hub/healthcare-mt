# Hostinger Unlimited: deployment candidate

Based on the live Sites version 10. This is a separate Node.js/Next.js and MySQL adaptation. It has not been deployed and must pass staging checks with a real Hostinger MySQL database before production use. The current Sites website is unchanged.

## Setup
1. In Hostinger create an isolated Node.js web app on a staging domain and a new MySQL database. Use Node 22 or 24, Next.js preset, npm build `npm run build`, start `npm start`. Node 22.13+ is required. Upload this source archive, not `node_modules` or a prebuilt `.next` folder.
2. Import `hostinger/schema.sql` into the new empty database using hPanel/phpMyAdmin. Do not run against existing live data without backup and review.
### Database connection values (common failure)
Hostinger silently prefixes every database and database user with the hosting account username (for example `healthcare_db` becomes `u123456789_example_db` and `example_user` becomes `u123456789_example_user`). hPanel displays the short names, so copying them into `DB_NAME`/`DB_USER` produces `Access denied for user ... (using password: YES)` and the whole app fails: `/studio` sign-in returns 503, `/blog` returns 500 and the inbox never loads. Use the full prefixed names from hPanel's database details (or the Hostinger API `hosting_databases_list`).
Also set `DB_HOST=127.0.0.1` for the deployed app. `srvNNNN.hstgr.io` is the external host and only works after adding a remote-access rule.
If sign-in or `/blog` fails, read the Node.js runtime logs first: the exact MySQL error is recorded there.

3. Run `node hostinger/create-admin-hash.mjs` locally, in a private terminal; the password entry is visible. Use a unique long password and protect terminal output. It prints an admin password hash, session secret and a new encryption key. Place these and DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME and APP_ORIGIN (the exact HTTPS staging origin, no trailing slash) in Hostinger environment settings. Do not send credentials in chat or store them in source. Configuring a new key is appropriate only for a fresh empty database.
4. Leave SEO_INDEXING=private and SITE_ACCESS_MODE=owner-private on staging. Open /studio over HTTPS to sign in with the password. /studio/content is the CMS. Signing out is available from the inbox. Rotate ADMIN_SESSION_SECRET to invalidate all sessions and change ADMIN_PASSWORD_HASH to replace the shared password. These are shared credentials, not individual team accounts or ChatGPT sign-in.
5. On staging, test every form, conditional path, signed resource download, enquiry inbox editing/export, CMS save/publish/hide and concurrent changes. Check invalid authentication, cookie security, rate limiting, real domain proxy behavior and all representative pages. Verify noindex on staging.
6. When staging has passed and the owner chooses cutover, configure the production HTTPS origin, approved search and analytics settings and provider details. Only then arrange DNS/hosting change. See INTEGRATIONS.md for analytics caveats; the file describes the old Sites version and is historical in other respects.

## Data and security
No live enquiries, CMS overrides, database or secrets are included. Existing encrypted enquiries require the original `INTAKE_ENCRYPTION_KEY` and a separately verified database migration. Never replace the key for an existing database. Obtain authorized database backups and plan import/reconciliation before cutover. D1 and MySQL SQL are not interchangeable; schema creation does not migrate records. Existing records expire after 90 days per site design.

Rate limits in this candidate use a conservative global key because the correct trusted proxy/client-IP contract has not been verified on this account. A busy site can hit this shared limit; configure and test a trusted proxy strategy and distributed abuse protection before production. Admin sign-in has a global attempt limit and a shared password, not individual accounts or MFA. Security review and Hostinger integration testing remain necessary before claiming production readiness. Set long random secrets and use HTTPS.

## Checks completed in this environment
- TypeScript and Next.js production build passed.
- Existing 21 intake validation, cryptography and signed-link tests passed.
- Local HTTP smoke checks: homepage and login page 200; anonymous inbox and CMS APIs 403; robots route 200.
- MySQL schema and application flows were not tested against a running MySQL server or on Hostinger. No data migration or DNS changes were performed.

This codebase also retains historical README files and examples from the Sites build; where they conflict, this guide and the current source are authoritative. It is a deployment candidate, not a verified production-ready release.
