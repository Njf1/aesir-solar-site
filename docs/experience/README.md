# Aesir Solar — local experience

The current milestone is **From Earth to a working roof**: a tiny source, monumental living Sun, an acquired white-gold guide, continuous flight, a rendered daylight Earth, Great Britain, atmospheric descent, a detailed commercial site, roof-array traversal and intimate panel approach, followed by the existing HTML application-service section.

Open [the local preview](http://127.0.0.1:4173/experience). Read the [stage-three implementation and verification report](stage-three/README.md), [captures](stage-three/captures/index.html) and [full vision register](stage-three/vision-register.md).

Working project: `/Users/nick/Projects/Aesir Solar/experience-stage1`, branch `experience/stage-three`. The original `site` checkout is untouched. The reviewed first draft is recoverable at tag `experience-stage-one-reviewed` (`9845462`); its [notes](stage-one-notes.md) and original captures are retained. Accepted stage two is recoverable at `experience-stage-two-reviewed` (`ecb981d`).

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

Glass/cell absorption, DC/inverter/AC, optional storage, business activation and the later benefit content remain [future storyboard work](storyboard.md). The [audited application-storage/payment/fulfilment gaps](backend-blockers.md) remain unresolved by this visual milestone.
