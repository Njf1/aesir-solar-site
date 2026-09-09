# Final measured results

Final checks: type checking and build passed; **82 Node tests / 118 browser checks passed**, full suites. Generator parity passed. All five scene and page captures, and the two new forward/reverse recordings, reported no browser errors or warnings. Deliberate failure tests are separately isolated.

Host: Apple M4 MacBook Air 16GB (Mac16,13), Chrome for Testing 151.0.7922.34 with ANGLE Metal. These are desktop/phone-sized viewport runs; no physical-phone certification or broad Safari/Firefox claim. A separate native Safari 26.6.2 public smoke review passed the sampled scenes, Pause, Skip, application and Back; its limits and captures are recorded under production/safari/.

The five viewports were 1280×720, 1600×1000, 390×844, 740×900, 1000×500. Eight scenes (Sun, Earth, panel, cell, inverter, business, storage, brand) each retained a **16.7ms median** frame interval; p95 ranged **17.8–18.7ms**. Opening readiness was **118–132ms** on loopback; lazy owner first-use readiness **34.2–95.2ms**. These measure rAF cadence and local loading, not GPU execution or internet/phone speed.

Three repeated traversals retained **79 geometries, 8 textures and 23 requests**, one renderer/canvas. Every editorial reading sample froze ambient time and emitted no render-frame samples. Settled timing ran after the browser suite and recordings, with no competing browser review workload.

Compiled JavaScript totals **254,774 B gzip**, **272 B** above the reviewed stage-seven source. Media/geographic JSON stays **1,844,085 B**. Both ceilings are unchanged (750,000 / 2,000,000 B). The homepage stylesheet is **8,087 B gzip**, +287 B over stage seven. The independent suitability stylesheet is 7,163 B gzip, loaded on its own page; the aggregate compiled CSS figure 15,250 B is not the homepage's initial CSS download. Supporting guide styles do not import the film.

No additional external media, decoded texture or render target. Interior buffers are **61,360 B desktop / 54,352 B mobile**, with **22 base draws**. The existing full business owner additionally includes its supported AC route and containment. Baseline retained Earth/site texture-target storage remains approximately 102.33 / 25.58 MiB before other overhead; process/GPU-driver memory is not independently established here.

The homepage's authored lower content is **79.5% shorter**, from 2,447 to 502 words under the documented counting method. Complete material is still available on the native solar, suitability and FAQ pages. See [route manifest](route-content-manifest.md) and [data/claim locations](vision-register.md).
