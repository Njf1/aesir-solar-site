# Fasthosts retirement — mailbox dependency confirmed

9 September 2026, after the live Vercel release. The user authorised retiring the old WordPress website/hosting, retaining the domain for a later registrar transfer. The current site itself does not depend on Fasthosts web hosting: `https://aesirsolar.co.uk/` returned HTTP 200 from Vercel, with apex A `216.150.1.1`.

## Why package deletion has not been performed

Authenticated Fasthosts shows **Go (Hosting for WordPress)**, package `1123360264`, website `1138393865`, with email service `1138393867` attached. The website removal confirmation at `/Hosting/Websites/WordPress/1138393865/Webspace/Delete` explicitly says:

> All email addresses will be removed along with all mail.

It also removes related website services/subdomains and assigned Microsoft 365 users, while leaving domain registration. The database is not automatically deleted by this website-removal operation. Therefore, removing the website is neither an email-safe operation nor proof that package billing has stopped.

The **hello@aesirsolar.co.uk** mailbox receives customer mail and is the authenticated SMTP sender used by production application alerts. MX remains `10 mailserver.livemail.co.uk`; the new application uses `smtp.livemail.co.uk` over TLS. Cancelling the bundle now would break those functions. This is an observed dependency in the actual account, not a hypothetical warning.

No domain-removal confirmation was entered/submitted. The destructive page was exited with Cancel. No website files, mailbox, mail, database, billing plan or DNS records were deleted or cancelled in this inspection.

## Next action

The user has been asked whether to use an existing Microsoft 365/Google Workspace service or have a low-cost standalone email option prepared. No replacement provider or paid plan is selected yet.

1. Agree the mailbox destination and any actual cost before purchase. Preserve the hello address and existing mail; check aliases/forwarding and any other assigned mail users before removal.
2. Migrate email, configure the new provider's authenticated sending/DNS, and update production alert delivery. Prove incoming mail and authorised outgoing test delivery before cancelling Fasthosts.
3. Verify the website, Stripe callbacks, applicant returns and mail remain independent of WordPress. Then remove the old WordPress service and cancel its hosting/associated web-only charges, keeping domain registration/DNS intact until the later transfer. Confirm the actual effective cancellation date and billing state.

Do not ask the user to cancel this bundle while hello still depends on it. Do not transfer/cancel the domain as part of the hosting retirement.

## Recovery

The existing private WordPress file archive (273,181,820 bytes) and SQL archive (1,425,955 bytes) were re-hashed; both match the [recovery manifest](recovery-manifest.json). They remain outside Git/static delivery. This is archive-integrity verification, not a new restore drill or automatic backup service. The original local `site` checkout and recovery history are retained.

The [live release handover](release-2026-09-09.md) remains the source for deployed Stripe intake, payment verification, work items and alerts. The [Fasthosts WordPress product page](https://www.fasthosts.co.uk/web-hosting/wordpress), accessed 9 September 2026, also describes bundled email; the account-specific deletion warning above controls this decision.
