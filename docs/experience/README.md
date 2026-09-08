# Aesir Solar — local experience

The current local implementation is [stage five — energy put to work](stage-five/README.md). The [complete vision register](stage-five/vision-register.md) distinguishes implemented scenes, final verification still to record and future evidence/operational work.

The source, Sun, flight, Earth, Great Britain and commercial roof journey continues through the selected panel's glass into an attached silicon-cell section. Absorption ends the light guide; distinct electrical-energy cues follow contacts and the supported DC route to a generic inverter. AC then reaches useful activity inside the same business, optional storage charges and later discharges, and one labelled grid-import condition leads to the settled Aesir/application-service reveal. The original HTML service remains accessible throughout. The 879-module campus is illustrative, not a verified customer or eligible A1-2 design.

Open [the local preview](http://127.0.0.1:4173/experience). Read the [stage-five handoff](stage-five/README.md), [science](stage-five/science.md), [interior provenance](stage-five/interior-provenance.md), [storage/grid provenance](stage-five/storage-provenance.md) and [storyboard](storyboard.md). The handoff includes final test results, five-view captures, continuous recordings, first-entry/settled measurements and the recoverable checkpoint.

Working project: `/Users/nick/Projects/Aesir Solar/experience-stage1`, branch `experience/stage-five`. Final stage-five checkpoint/tag: **`experience-stage-five-delivered`**. The original `site` checkout is untouched. Recoverable earlier milestones remain:

- First reviewed draft: `experience-stage-one-reviewed` (`9845462`), with [notes](stage-one-notes.md) and original captures retained.
- Stage two: `experience-stage-two-reviewed` (`ecb981d`), with exact Earth source records.
- Stage three: `experience-stage-three-delivered` (`6565351`), with geography and campus provenance.
- Stage four: `experience-stage-four-delivered` (`55ef47f`), with [its report](stage-four/README.md), [captures](stage-four/captures/index.html), [continuous recording](stage-four/motion/journey-forward-reverse.webm) and cell/electrical provenance. Those are historical stage-four results, not stage-five measurements.

## Local checks and preserved scope

With Node 24 and the existing pinned dependencies:

```sh
npm run typecheck
npm run build
npm test
npm run preview
npm run test:browser
```

The preview is loopback-only on port 4173 and returns JSON `503 local_preview_only` for every `/api/*` route. Browser checks block external requests; payment contract tests use mocks and dummy inputs. No provider request, payment, application submission, publication or public-homepage replacement is part of this work.

Only the experience entry is compiled by Vite; `scripts/assemble.mjs` preserves original pages, forms, functions and routes in `.release/`. Baseline parity tests compare the application, consent fields and business files byte for byte against audited baseline `c61643f`. Stage-five regression fixtures preserve the accepted 0–4.08 journey and eight original stills while adding the new scenes and four stills.

Evidence-backed independence, economics, equipment longevity/warranties, sustainability, storage/resilience benefits, monitoring/proof, optional audio/cursor polish and physical-device/broader-browser performance remain pending in the [vision register](stage-five/vision-register.md). The [audited application-storage/payment/fulfilment gaps](backend-blockers.md), suitability enforcement and telemetry freshness remain independent repairs before public rollout. The visual milestone does not complete that operational chain.
