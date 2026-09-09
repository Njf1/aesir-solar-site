# Real-domain route manifest — delivered

9 September 2026. The new site is live on **https://aesirsolar.co.uk**. `www` redirects to the apex with HTTP 308 and preserves path/query strings. Vercel clean URLs canonicalise `.html` variants and trailing slashes. [Public route evidence](public-routes-live.json) records 17 successful checks, including historical paths and www TLS.

| Route | Delivered destination / behaviour |
| --- | --- |
| `/`, `/index[.html]`, `/experience[.html]` | New cinematic homepage; canonical URL is the apex homepage. |
| `/form-a/`, `/cart/`, plain `/checkout/` | New `/apply`; old WooCommerce billing/cart presentation is retired. Query strings do not create a cart or control the £300 fee. |
| `/checkout?key=…`, `/checkout/order-received/…` | New `/success?legacy=1`; references are preserved as context, never proof of payment. |
| `/checkout/order-pay/…` | `/contact?legacy-order=1`; historical orders are reviewed privately, never charged automatically. |
| `/shop/`, `/product/begin-your-application/` | `/#application-details`, the precise application-service offer. |
| `/my-account/…` | `/contact?existing-applicant=1`; no unverified customer-account feature is advertised. |
| `/faq[.html]`, `/contact[.html]` | New complete, styled pages; direct `hello@aesirsolar.co.uk` contact. |
| `/solar[.html]`, `/suitability[.html]` | Supported business content and suitability guidance. Unknown/out-of-scope checks lead to contact. |
| `/simulator[.html]` | Explicit solar-planning explanation/retirement destination; original simulator source remains in recovery history. |
| `/apply[.html]` | Original 19 named controls and both consents, consistent styling, server screening, durable intake and Stripe Checkout. Four additional unnamed suitability confirmations are stored separately. |
| `/success[.html]` | Private-token/server-verified payment status. Query strings or legacy visits alone cannot claim payment or receipt. Application/receipt pages are noindex. |
| `/terms[.html]`, `/privacy[.html]`, `/refunds[.html]` | Complete styled policies with Stripe and Aesir Limited identity; substantive service/consent/refund qualifications preserved. |
| `/api/checkout`, `/api/application-status`, `/api/stripe-webhook` | Explicit current payment handlers, never a marketing redirect. Only verified server-side payment creates paid work. |
| `/api/operations` | Secret-authenticated recovery and alert worker. Anonymous requests return 401. |
| Other existing `/api/*` files | Existing contracts retained. Dormant Tyl has no configured credentials and is not selected by the browser. Do not re-enable it. |
| `/wp-admin/`, `/wp-json/`, unused sample pages/templates and unknown paths | Not served as the old site; unknown paths remain genuine 404s. WordPress files/orders remain privately recoverable. No blanket homepage redirect. |
| Old WordPress/WooCommerce callback links | No longer an active payment mechanism. They cannot verify a new Stripe application. Historical customer/order enquiries go to contact; private records were retained. |

Native homepage fragments retained: `#top/#main` opening, `#gate` service explanation, `#check` suitability, `#work` process, `#price/#apply` offer and `#realroof` dated record. These are HTML anchors because servers do not receive fragments. Earlier route/browser coverage tests .html, extensionless paths, relevant query strings, Back and no-JavaScript navigation.

The Stripe live webhook deliberately remains on `https://aesir-solar.vercel.app/api/stripe-webhook` so DNS changes do not interrupt callbacks. Customer Checkout returns use the initiating allowlisted Solar origin, preserving that browser's private receipt access. Stripe website, support, terms and privacy URLs point to the real domain.

All inventoried useful public pages were migrated or deliberately retired; the [old public inventory](public-route-inventory.json) is historical evidence. We have not claimed that every arbitrary WordPress attachment or unrecorded email URL has a new equivalent. Unknown/historical enquiries have the new contact route; original private recovery records remain available. Hosting and the hello mailbox were not cancelled.
