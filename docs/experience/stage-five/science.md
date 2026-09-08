# Stage five — useful energy, optional storage and the connection story

Scientific and depiction record, **8 September 2026**. The primary sources below were checked live on that date; the integrated stage-five source was subsequently reviewed. Business activation, optional storage, later discharge, grid import and the Aesir reveal are implemented. Final build, browser, capture and performance evidence is recorded in the [stage-five handoff](README.md). This record does not certify a system or verify business operations. [Stage-four science](../stage-four/science.md) and earlier asset records remain applicable.

## The distinction the visitor should understand

The scene explains how the array's AC electricity can be used at the business, how an optional battery can shift some use to a later time, and why the network connection deserves a proper application process. The absorbed white-gold light never returns as a charge carrier or parcel travelling through the business.

| This should look like… | What would make it misleading |
| --- | --- |
| An optional branch from the AC side reaches a separate battery converter, then the battery. Later, a different state shows stored energy returning through that converter to useful loads. | A battery permanently inserted between the solar inverter and every load; a bare AC wire entering battery cells; charging and discharging shown together without explanation. |
| One labelled illustrative import condition. Export is a different, unshown condition whose operation depends on the agreed connection. | Opposing arrows presented as simultaneous net import/export, automatic export permission, or an unlabelled outage/backup demonstration. |
| The campus comes alive, movement settles, and Aesir's actual application service becomes the next step. | A fictional customer result, a promise that one cell powers the site, or a suggestion that £300 buys this installation. |

## Verified science and the chosen topology

Storage retains energy for later use. Battery storage uses chemical processes; it has finite energy capacity and power capability, and charging/conversion/retrieval incur losses. These facts support a bounded, qualitative stored-energy indication. They do not establish a duration, capacity, efficiency or performance value for this artwork. [DOE, Solar Energy and Storage Basics](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics).

**Authored choice: one optional AC-coupled example.** Keep the existing PV inverter, connect the battery branch on the AC side, and show a separate bidirectional battery converter. Charging is AC → converter → DC → battery; later discharge is battery DC → converter → AC → business. This is a selected example, not the universal arrangement. DOE distinguishes AC coupling with separate PV and battery inverters from DC coupling. Its 2019 article is used only for this topology; its historical costs, market counts and projections must not enter the experience. [DOE, Solar-Plus-Storage 101](https://www.energy.gov/cmei/systems/articles/solar-plus-storage-101).

Backup is conditional. DOE states that solar-plus-storage can operate without grid support when its inverter system is designed for that purpose. Adding a cabinet alone does not demonstrate backup. Do not show the grid failing while this whole campus continues unchanged, or promise resilience, autonomous operation or uninterrupted service. [DOE, Inverters and Grid Services Basics](https://www.energy.gov/cmei/systems/solar-integration-inverters-and-grid-services-basics).

## Authored state and visual rules

These rules are implemented in `business-journey.ts`, the scene owners and accessible HTML; they describe authored states, not measurements or external design guidance:

1. Establish the AC route to useful business loads before introducing storage. Keep a supported physical cable path and a distinct explanatory energy overlay. Arrows or bands describe net energy routing; they are not individual electrons, AC oscillations or propagation speed.
2. Label the battery **optional** at its first meaningful appearance. The original PV-to-business route remains understandable without that branch. Do not assign invented manufacturer specifications to the converter, battery, switchgear or loads.
3. Author a charging phase, a quiet separation and a clearly labelled **later use** phase. The stored-energy indication rises only while charging and falls only while discharging. Clamp it; do not imply lossless, infinite or instantaneous storage. A qualitative indication needs no percentages, kWh or countdown.
4. The final grid vignette shows **import only**; `exportFlow` is zero throughout the authored timeline. The generic storage asset can reverse a route, but that API capability is not a delivered export scene. HTML identifies export as a separate condition dependent on the design and agreed connection. No power-flow solver, automatic export approval, tariff optimisation or live metering is depicted.
5. Before useful activity begins, show accessible HTML: **“Illustration of operation after the required permissions and commissioning.”** Keep the statement legible for ordinary and reduced-motion viewing. This is the depicted scenario, not a claim about the operational status of a real customer.
6. Activate lights, a few pieces of equipment and screens with restraint; avoid a simultaneous neon sweep. Let the camera settle before the brand/service payoff. Do not use the optional battery as the unexplained source for every light, or imply a single highlighted module provides the entire campus load.
7. Derive route state, stored-energy indication, activation, light intensity, camera and copy from authored progress. Reversal replays the explanation; it is not physical time reversal. Pause, hidden/offscreen suspension and reduced motion freeze ambient animation while retaining meaningful still compositions.

The implemented copy is **“ENERGY, PUT TO WORK.”**, **“KEEP SOME FOR LATER.”**, **“WHEN IT’S NEEDED.”**, **“PART OF A CONNECTED SYSTEM.”**, **“A LONG JOURNEY.”**, **“A CONNECTION WORTH GETTING RIGHT.”**, then **“AESIR SOLAR”** and **“Your G99 application. Prepared. Submitted. Followed through.”** The last-few-metres idea resolves into the connection/application service. No claim is made that Aesir supplies or installs a final cable. The operating note precedes activation; the expandable HTML explanation repeats its meaning for still and no-canvas access.

## British connection and application boundary

The current NGED procedure page distinguishes application routes, uses continuous inverter rating for inverter-connected generation and assigns commissioning checks to the installer. Its table lists A1-2 for particular fast-track categories, not every commercial PV project. Therefore **the 879-module campus is illustrative, not a verified eligible A1-2 design**. Do not infer eligibility, registered capacity or product suitability from the rendered panel count or roof area. [NGED, G99 connection procedures](https://connections.nationalgrid.co.uk/g99-connection-procedures).

The linked guide separates application/offer, construction and commissioning responsibilities; requirements vary with the installation category. Its connection agreement records technical requirements. The film's operation-after-permission statement is a conservative description of this illustrative scenario, not a universal claim that every generation installation needs the same approval sequence. Avoid timings, technical thresholds and operational-notification jargon in new visitor copy. [NGED, G99 Connection Procedures Guidance Document, PDF pp. 2 and 5–9](https://connections.nationalgrid.co.uk/downloads/24747).

The service remains the supplied proposition: G99 Form A1-2 preparation, submission and follow-up across Great Britain, **£250 fee + £50 VAT = £300 total per application**, with no guaranteed approval. Installation, equipment and a finished working system must not be represented as included in that fee. Do not imply that the film's service price covers any separate network charges; preserve the offer's existing terms and assess actual connection charges separately. Keep installer/property-owner distinctions, eligibility/contact routes and both consents.

## Source and asset provenance

| Primary source | Checked | Permitted use and boundary |
| --- | --- | --- |
| [DOE storage basics](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics) | 2026-09-08 | Qualitative storage, losses and finite energy/power. No project benefit or performance value. |
| [DOE inverter basics](https://www.energy.gov/cmei/systems/solar-integration-inverters-and-grid-services-basics) | 2026-09-08 | Conversion and conditional grid-independent operation; no automatic backup claim. |
| [DOE Solar-Plus-Storage 101](https://www.energy.gov/cmei/systems/articles/solar-plus-storage-101) | 2026-09-08; published 2019-03-11 | AC/DC coupling distinction only; exclude historical economics and market data. |
| [NGED procedure page](https://connections.nationalgrid.co.uk/g99-connection-procedures) | 2026-09-08 | Actual application-route distinction and installer responsibilities. This operator's guidance is not proof that the example campus qualifies. |
| [NGED linked procedure guide](https://connections.nationalgrid.co.uk/downloads/24747) | 2026-09-08; 10-page PDF; no revision date established here | Connection-process context and category-dependent responsibilities. No borrowed process graphic or installation design. |

These pages were consulted as factual references; no source diagram or other visual asset was copied. The integrated new geometry, cabinet designs, containment, work equipment, office screen and flow materials are original generic procedural artwork, authored on 8 September 2026 with Codex assistance. Their inputs are the existing campus/metre coordinates, existing AC entry and pinned Three.js 0.185.1. No new external model, image, texture, font, product data, rating or certification is incorporated. See [business provenance](interior-provenance.md) and [storage/grid provenance](storage-provenance.md) for actual source paths and ownership. Final source/build [checksums](checksums.json) and [delivered bundle sizes](../asset-sizes.json) identify the reviewed build. DOE and NGED references imply no endorsement.
