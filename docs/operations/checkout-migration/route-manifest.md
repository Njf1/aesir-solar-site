# Real-domain route migration manifest

9 September 2026. **Target behavior, pending authenticated backend inspection and implementation.** Existing Vercel pages are already in the new style; the WordPress routes below still exist on the real domain. This manifest does not claim they have been retired.

| Current / legacy route | Required outcome | Boundary |
| --- | --- | --- |
| `aesirsolar.co.uk/`, `www.aesirsolar.co.uk/` | One canonical new homepage; alternate host redirects predictably | Add/verify domain assignment and TLS before DNS cutover; keep email DNS intact. |
| `/index[.html]`, `/experience[.html]` | New homepage, same native compatibility fragments | Preserve campaign query strings, Back and no-JS navigation. |
| `/form-a/` | New `/apply.html` installation form | Old billing form is not a replacement for the 19 installation controls. |
| Plain `/cart/`, `/checkout/` | New application/payment flow in the shared design | Do not forward `add-to-cart=308` or cart quantity behavior. Payment return/order-pay/callback subpaths and query parameters need explicit handling, not a blanket redirect. |
| `/shop/`, `/product/begin-your-application/` | New offer at `/#application-details` | One suitable Form A1-2 application: £250 + £50 VAT = £300. Old product/orders remain in the back office if it is retained. |
| `/my-account/` | New support destination, or a verified styled order-status flow if an actual account facility is retained | Preserve lawful access to historical orders privately; do not claim a new account/login feature exists. |
| `/sample-page/`, public sample posts/unused templates | Deliberate retirement/410 after content inventory | Do not silently republish sample content or delete customer/order records. |
| `/faq[.html]`, `/contact[.html]` | Existing new styled full FAQ and usable email support pages | Preserve useful answers and `hello@aesirsolar.co.uk`. |
| `/simulator[.html]` | Existing new solar-planning/retirement explanation | Keep the old model/source in recovery history, not as a public measurement/quote tool. |
| `/apply[.html]` | Existing new installation form, connected to verified durable intake and Tyl | Keep 19 fields, consents, prefill/cancellation context, server-controlled price and stable application/payment reference. |
| `/success[.html]`, Tyl/browser return URLs | New truthful status page backed by authoritative state | Preserve relevant references safely. No “paid/received” state from a query string or unbound signature alone. |
| `/terms[.html]`, `/privacy[.html]`, `/refunds[.html]` | Complete new styled policies | Payment-provider wording follows the actual Tyl-only implementation; preserve substantive service/refund/consent terms. |
| `/api/*` | Explicit application/payment/provider handlers | Never capture with a homepage/cart redirect. Retire dormant alternate-provider behavior deliberately without exposing a false payment flow. |
| WooCommerce `wc-api`, gateway callbacks, order-pay/order-received paths | Preserve or explicitly migrate the actual installed plugin's routes | Exact paths, signatures, return links and historical email links must be inventoried in admin before changing host/routing. |
| `/wp-admin/`, WordPress backend/API/order infrastructure | Private retained administration or archived system as required by the chosen migration | User asked to remove old **public presentation**, not erase historical orders, credentials, refunds or records. Do not expose the old site through an unplanned public alternate host. |
| Uploaded policies/useful documents and old emailed links | Preserve purpose with mapped new destinations or restricted historical access | Inventory is incomplete until admin/hosting inspection; do not issue blanket root redirects and claim every old link is fixed. |

Native homepage fragments retained: `#top/#main` opening, `#gate` service explanation, `#check` suitability, `#work` process, `#price/#apply` offer, `#realroof` dated record. Fragments are not sent to servers; current HTML anchors remain required.

The public page/product/sitemap inventory is in `public-route-inventory.json`; it contains no private orders or user records. The old WordPress homepage links to `/form-a/`, and its cart currently renders the screenshot's billing checkout. The candidate's removed `app.js` fallback is the confirmed connection between the two websites.
