# Final measured performance

Recorded 2026-09-08T23:17:32.690Z. Actual host: Apple M4, 16 GiB, Mac16,13; Chromium 151.0.7922.34, ANGLE Metal. All five views are on this desktop host, including the phone-sized view.

Each settled scene is sampled for four seconds. Values below are the 95th-percentile requestAnimationFrame interval in milliseconds, not a GPU timer query. Median cadence is reported in the full JSON. Timing runs separately from capture/recording and other review browser work.

| View | Opening ready (ms) | Sun | Earth | Panel | Cell | Inverter | Business | Storage | Brand |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×720 | 163 | 17.4 | 17.3 | 17.4 | 17.4 | 17.5 | 17.5 | 17.5 | 17.5 |
| 1600×1000 | 163 | 17.4 | 17.4 | 17.4 | 17.4 | 17.4 | 17.3 | 17.3 | 17.5 |
| 390×844 | 150 | 17.5 | 17.3 | 17.4 | 17.3 | 17.5 | 17.4 | 17.3 | 17.4 |
| 740×900 | 149 | 17.4 | 17.4 | 17.4 | 17.4 | 17.4 | 17.4 | 17.4 | 17.5 |
| 1000×500 | 165 | 17.3 | 17.3 | 17.3 | 17.4 | 17.5 | 17.3 | 17.4 | 17.4 |

## First owner readiness

Fresh browser contexts and disabled HTTP cache measure first request through local import/build/shader readiness. These are loopback observations; operating-system and driver caches were not cold-reset. They are not internet-download or physically cold-phone predictions.

| Owner | Min–max across five views (ms) |
| --- | ---: |
| region | 66.0–84.7 |
| site | 75.8–96.9 |
| cell | 91.7–114.2 |
| electrical | 25.8–37.4 |
| business | 51.9–55.6 |
| storage | 22.6–27.0 |

## Transfer, resources and suspension

Experience JavaScript: **254,502 B gzip**. All served browser JavaScript including the unchanged application controller and small supporting script: **262,670 B gzip**. Media/geographic JSON across all variants: **1,844,085 B**. Experience CSS: **7,800 B gzip**. The 750,000 / 2,000,000 B ceilings remain unchanged.

The loopback preview uses uncompressed no-store responses. Gzip file accounting above is separate from the actual encoded bodies/request overhead below. Both include the historic evidence HTML; desktop/mobile variants differ.

| View | Opening encoded bodies | Complete encoded bodies | Cached reversal geometry / texture / requests |
| --- | ---: | ---: | --- |
| laptop | 974,605 B | 2,478,385 B | 79→79 / 8→8 / 22→22 |
| desktop | 974,605 B | 2,478,385 B | 79→79 / 8→8 / 22→22 |
| mobile | 896,603 B | 1,736,741 B | 79→79 / 8→8 / 22→22 |
| intermediate | 896,603 B | 1,736,741 B | 79→79 / 8→8 / 22→22 |
| short | 974,605 B | 2,478,385 B | 79→79 / 8→8 / 22→22 |

Every editorial destination stopped ambient time and produced zero further render-frame samples. Three old/new traversals in each view retained one canvas and unchanged resource/request counts. Resize/orientation has a separate test because the Sun detail can be replaced while cached owners retain their initial texture tier.

Original authored detail adds 34,734 buffer bytes, 10 base draws and 5,925 desktop / 5,669 mobile triangles, under the predeclared 40,000 / 10 / 7,000 envelope. No new media, textures, render targets or real lights were added. Retained Earth/site texture-target estimates remain about 102.33 / 25.58 MiB before geometry, shadows and driver overhead. Browser-process or real GPU allocation was not inferred from those estimates.

All normal benchmark views reported zero browser errors and warnings. Physical-phone, full Safari/Firefox regression and performance, internet-cold readiness and thermal testing remain open. Safari 26.6.2 received a separate limited native desktop smoke review; no Safari timings are claimed.
