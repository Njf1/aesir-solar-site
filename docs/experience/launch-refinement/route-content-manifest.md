# Current route and content manifest

Updated 9 September 2026. Generated pages are owned by `templates/site/` and `build.py`; the homepage is authored in `experience.html`. The original site checkout remains intact. All .html links are canonicalized by Vercel cleanUrls while query strings and browser fragments remain.

| Routes | Current result |
| --- | --- |
| `/`, `/index`, `/index.html`, `/experience`, `/experience.html` | Cinematic homepage, immediate `#application-details` offer, compact process/suitability/FAQ/evidence links. |
| `/apply`, `/apply.html` | Same 19 named controls, both required consents, original validation, prefill/cancellation context, £300 and provider selection. No film download. |
| `/solar`, `/solar.html` | Complete supporting solar explanation, claims/sources and dated Tigo transcription with accessible hourly chart/table. No film download. |
| `/suitability`, `/suitability.html` | Documented-AC guide, conservative client checker, contact-only outcomes; not certification or server enforcement. Small standalone enhancement; no film. |
| `/faq`, `/faq.html` | Complete native FAQ page, replacing the prior automatic homepage redirect. |
| `/contact`, `/contact.html` | Direct supplied email, useful enquiry fields and help for existing applicants. |
| `/simulator`, `/simulator.html` | Explicit retired-calculator/planning explanation. Original model remains in recovery history. |
| `/success`, `/success.html` | Neutral, unverified return state; preserves payment reference/cancel/status context without claiming receipt. |
| Terms, privacy, refunds and `.html` variants | Full existing policy terms and consent destinations in shared design. |
| All five `/api/*` handlers | Existing implementations built as Node functions. Not captured by marketing redirects; no raw handler/helper source in static output. API cache is explicitly `no-store`. |
| Unknown routes | 404, without a marketing catch-all. |

Native homepage fragments remain: `#top/#main` opening; `#gate` service; `#check` compact suitability destination linking the complete guide; `#work` three-step process; `#price/#apply` offer; `#realroof` dated summary linking the full record. All five stage-six content anchors remain useful. Fragments do not depend on server redirects or JavaScript.

The fee remains £250 + £50 VAT = £300 per suitable Form A1-2 application in Great Britain, for preparation/submission/follow-up. It does not buy installation or guarantee approval. The illustrated campus is not a verified eligible design. Installer/property-owner distinctions and all original legal/eligibility/support routes remain.

`npm run build` generates templates before Vite compiles the homepage and suitability entry. Assembly stages an explicit allowlist, then replaces only its generated `.release` directory. Root API functions are owned by Vercel. `.vercelignore` excludes credentials, generated output and review media, but retains generator/source templates. Repeated-build/retirement regression remains.

Frontend publication does not fix durable intake, authoritative matching payment or a single actionable work item. No provider configuration, real submission, payment or message was part of this release. The original fallback cart remains external. Search indexing stays disabled pending operational release readiness.
