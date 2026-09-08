# Aesir Solar — local experience

Latest local milestone: [stage four — light becomes useful electrical energy](stage-four/README.md). The [complete vision register](stage-four/vision-register.md) records implemented and pending work.

The current milestone is **Light becomes useful electrical energy**. The existing source, Sun, flight, Earth, Great Britain and commercial roof journey continues through the selected panel's glass into an attached silicon-cell section. Absorption ends the incident-light guide; a distinct electrical-energy overlay follows the contacts, module junction and supported DC route to a generic inverter and first AC output. The existing HTML application-service section follows.

Open [the local preview](http://127.0.0.1:4173/experience). Read the [stage-four implementation and verification report](stage-four/README.md), [captures](stage-four/captures/index.html), [continuous forward/reverse recording](stage-four/motion/journey-forward-reverse.webm) and [full vision register](stage-four/vision-register.md).

Working project: `/Users/nick/Projects/Aesir Solar/experience-stage1`, branch `experience/stage-four`, delivery tag `experience-stage-four-delivered`. The original `site` checkout is untouched. The reviewed first draft is recoverable at tag `experience-stage-one-reviewed` (`9845462`); its [notes](stage-one-notes.md) and original captures are retained. Accepted stage two is recoverable at `experience-stage-two-reviewed` (`ecb981d`), and stage three at `experience-stage-three-delivered` (`6565351`).

## Local checks

With Node 24 and the existing dependencies:

```sh
npm run typecheck
npm run build
npm test
npm run preview
npm run test:browser
```

The preview is loopback-only on port 4173. It deliberately returns JSON `503 local_preview_only` for every `/api/*` route. Browser checks block external requests. Payment contract tests use mocks and dummy inputs. No provider request, payment, application submission, publication or public-homepage replacement is part of this work.

Only the experience entry is compiled by Vite; `scripts/assemble.mjs` preserves original pages, forms, functions and routes in `.release/`. The application, consent fields and business files are checked byte for byte against audited baseline `c61643f`.

Optional storage, business/grid context, lights/equipment/screens activation, the final brand/connection payoff and evidence-backed benefits remain [future storyboard work](storyboard.md). The [audited application-storage/payment/fulfilment gaps](backend-blockers.md) remain unresolved by this visual milestone.
