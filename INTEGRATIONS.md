# Analytics and webmaster integration review

Prepared for Marketing Tusk Healthcare. This is a save-only source change: no deployment, production runtime change, DNS change, analytics account creation or verification submission has been made.

## Hosting inspection

The retained project is a Vinext/React server application with a Cloudflare Worker entrypoint. It controls the HTML head, client components, metadata and HTTP routes, so GA4 and Clarity JavaScript, Google/Bing meta verification, XML sitemaps and robots.txt are implementable in Sites source. Sites runtime variables configure IDs. No tag-manager, marketplace plugin, database migration or third-party API secret is needed. The Sites API currently reports healthcare.marketingtusk.com and its HTTPS certificate as active.

Successful code installation is not proof of third-party collection: after future deployment, verify provider requests and data in their dashboards. Ad blockers, browser settings or a hosting-added CSP can still block collection; do not weaken authentication or CSP indiscriminately. Verification and tracking IDs are intentionally public identifiers, unlike API secrets.

The current live revision has no analytics or verification variables and no public indexing settings. The existing code consequently selects the old Sites canonical origin, an empty sitemap and a crawl block. This candidate defaults public metadata, robots and sitemap to the already connected custom domain. Explicit SEO_INDEXING=private or SITE_ACCESS_MODE=owner-private still makes a future review deployment non-indexable.

## Configuration

Use Sites runtime settings when the reviewed version is ready for deployment. Supply only each value, not a whole script or meta tag. Do not replace unrelated settings. Runtime changes require a saved-version deployment to take effect.

| Setting | Placeholder in the example file | Behaviour while absent |
| --- | --- | --- |
| GA4_MEASUREMENT_ID | <YOUR_GA4_MEASUREMENT_ID> | GA4 is not installed |
| CLARITY_PROJECT_ID | <YOUR_CLARITY_PROJECT_ID> | Clarity is not installed |
| GOOGLE_SITE_VERIFICATION | <CONTENT_VALUE_ONLY> | No google-site-verification meta tag |
| BING_SITE_VERIFICATION | <CONTENT_VALUE_ONLY> | No msvalidate.01 meta tag |
| ANALYTICS_ENABLED | true when explicitly ready | Neither provider loads |
| ANALYTICS_CONSENT_MODE | required (default) | Requires a consent-granted event |
| SEO_PUBLIC_ORIGIN | https://healthcare.marketingtusk.com | Uses the connected custom domain |
| SEO_INDEXING | public; use private for staging | Public by default in this candidate |
| SITE_ACCESS_MODE | public; owner-private disables indexing | Existing admin checks remain independent |

Placeholder text and malformed IDs are ignored. No ID or code has been invented for use on the website. Verification values are rendered in the server head, including when analytics is disabled. No Search Console, Bing, Analytics or Clarity access token belongs in these fields.

## Analytics behaviour

- One loader per provider per document. Scripts are asynchronous and start after a short delay or a later consent signal. Tracking cannot prevent rendering or form submission when a provider is blocked.
- GA4 uses send_page_view=false and one explicit page_view for each public pathname transition; re-rendering the same page does not send another. No form, CTA, customer identifier, message, phone, email, search term or conversion event is instrumented by this change. Query strings and fragments are omitted from explicit GA4 page and referrer URLs.
- IMPORTANT in GA4: disable Enhanced Measurement, including history-based page changes, form interactions, site search and outbound clicks. This implementation owns page views. Google explicitly documents that send_page_view=false alone does not disable Enhanced Measurement history events.
- Clarity uses the official project loader and masks the document text through data-clarity-mask. Configure Strict masking in the Clarity project before enabling it; do not unmask forms or enquiry content. It never starts on a URL with a query string or fragment. This intentionally excludes campaign URLs and prefilled enquiry URLs from recordings.
- Exact known public routes only. Owner sessions, /admin, /studio, APIs, sign-in/out/callback routes, legal/utility states, hidden CMS entries and missing pages do not initialize tracking. Client navigation from a tracked page into a sensitive/excluded route, or a query URL with Clarity active, forces a fresh document so scripts do not follow private content.
- Do not add the same providers through another plugin, Google Tag Manager or copied snippets. Such account-level/external changes are outside this code's deduplication control.
- Default consent mode does not load either provider until the existing/future consent manager dispatches:
  window.dispatchEvent(new CustomEvent('mth:analytics-consent', {detail:{granted:true}}))
  Dispatch granted:false on withdrawal. Withdrawal denies GA storage and reloads the document to end recording.
- No banner, consent UI or privacy copy is added, in accordance with the request to preserve design and content. There is currently no consent manager in the project. Before enabling collection, connect an approved consent manager or explicitly approve preapproved mode after reviewing the site's disclosures and applicable collection requirements. The existing privacy page says the site does not add marketing analytics, so that disclosure needs owner-approved revision before collection is enabled. This candidate leaves that text unchanged.

## Account and DNS work for the owner

1. GA4: create/select the property and HTTPS web stream for healthcare.marketingtusk.com, copy its G- Measurement ID, disable the enhanced events described above, and review retention, data sharing and consent settings.
2. Clarity: create/select the project for the same domain and copy its Project ID. Set Strict masking; confirm recording suitability and consent configuration.
3. Search Console: use a URL-prefix property for https://healthcare.marketingtusk.com/ and select HTML tag verification. Provide only the meta tag's content value. After deployment, press Verify in Search Console. For a Domain property instead, add the exact Google-issued TXT or CNAME at your DNS provider; a head meta tag cannot verify a Domain property.
4. Bing: add the same site. Provide the msvalidate.01 content value for meta-tag verification, or import an already verified Search Console property. Complete verification in Bing after deployment. Bing DNS/CNAME verification must be done at your DNS provider using its exact issued values.
5. No new hosting or DNS configuration is needed for the two script integrations or URL-prefix meta verification on the already active domain. Domain-property/DNS verification is external to the website source; this change does not access the registrar.
6. After review approval, configure the real IDs/codes and enable settings, then deploy. Verify both meta tags in the unauthenticated homepage head. In GA4 Realtime/DebugView confirm one page_view per route, and inspect Clarity for masked public sessions. Check neither provider loads before consent or on admin pages, and confirm denied withdrawal behaviour.
7. Fetch https://healthcare.marketingtusk.com/sitemap.xml and /robots.txt anonymously, inspect canonical metadata for each page family, and submit the sitemap in both webmaster dashboards. The candidate sitemap excludes hidden content, owner routes, APIs, legal/utility states and duplicate URLs; it does not invent last-modified dates. Public accessibility and technical eligibility do not guarantee indexing.

## Primary documentation used

- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
- https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking
- https://support.google.com/webmasters/answer/9008080
- https://www2.bing.com/webmasters/help/add-and-verify-site-12184f8b
