# Releases 01–14 implementation

This review version merges the supplied master catalogue into the existing Sites application. It does not deploy or write to the production database.

- 240 master records: 60 guides and 180 answers.
- 80 existing canonical URLs updated in place, 160 new URLs added.
- Existing 24 standalone guides and 56 blog articles retained: 320 reading pages total.
- 61 referenced images copied into public/assets/editorial. Captions and accessible descriptions retained.
- Direct answers rendered in the existing opening-answer component; FAQs converted to editable content blocks.
- Legacy audit URLs mapped to /contact?intent=audit with current service and industry values. Two obsolete service links mapped to current service pages.
- Cut-off directory excerpts replaced with complete opening sentences from the supplied answer text.
- No duplicate canonical paths, normalized titles or master IDs. Similar-topic articles with distinct titles and content remain separate.

The archive's `review` state remains recorded as `sourceStatus`; it is not a claim of completed professional or factual review. In this saved candidate, imported pages are configured for publication when the version is deployed. The archive's editorial sign-offs should be resolved before that deployment.

The standalone Node.js server, passwords/auth system, historical ZIPs, editorial registers and internal release notes are not exposed on the public website. The existing ChatGPT authentication, CMS, D1 and forms continue to operate.

Existing D1 live copies, drafts and hidden flags remain untouched and take precedence over the imported base copy at the same canonical URL. Legacy image references remain valid when saving an older CMS draft. If an editor has a saved override, that page continues showing the override until the editor updates it deliberately.

See content/master-import-report.json for the exact added and updated paths, source archive checksum, and asset inventory. The analytics preparation from version 9 is retained with no runtime setting changes.

## Validation

- TypeScript and production build.
- 21 existing intake/security tests.
- Four import regression tests: identity/URL deduplication, assets, internal links/form values, CMS validation and legacy images.
- Browser preview: guide directory and imported analytics guide.
- Built Worker integration checks: 374 unique sitemap pages return 200 with canonical URLs and descriptions; all 61 imported assets are present in the build. Hidden CMS pages stay excluded, saved live CMS copy takes precedence, and unauthenticated CMS access is denied.
