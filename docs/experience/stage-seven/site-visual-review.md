# Stage seven supporting-page visual review

Reviewed existing captures on 8 September 2026. No browser was launched, no checkout files were edited, and no provider requests were made. This is a visual review of saved images, not an interaction or payment test.

## Findings

1. **Enlarged text clips important native control text at the short-screen width.** In `site-captures/short-apply-text200-full.png` (1000px wide), the application remains beside the order summary and its paired fields remain two columns. The supply selection displays only “Single phas” instead of the full “Single phase 230 V”; the date format is crowded against the calendar icon and its final year digit is not readable. This should show the complete selected supply and date segments. Collapse the form/paired controls earlier or use a large-text layout that supplies adequate field width, then recapture this exact case. The ordinary desktop/mobile/short form captures do not show this defect. The mobile enlarged-text capture has adequate widths for these controls.

2. **Minor enlarged mobile heading break.** `site-captures/mobile-apply-text200-full.png` puts the full stop after “installation” on its own line. The heading remains understandable, but the isolated punctuation is visually awkward. Keeping the final punctuation with the last word or removing that heading punctuation resolves it without changing any form contract.

3. **Full-page mobile capture needs a footer cross-check.** `site-captures/mobile-home-full.png` contains a repeated strip of the initial fixed hero/header below the footer at its bottom. The desktop and short full-home composites do not show that strip. This image alone cannot distinguish a fixed-layer screenshot artifact from a live rendering problem. Capture the actual mobile footer viewport after scrolling normally when the browser is free; do not count the existing composite as proof of a clean footer. The saved native-section viewport captures look normal.

## What the reviewed captures establish

| Surface | Existing images inspected | Visual result |
| --- | --- | --- |
| Application | Desktop 1600px, mobile 390px and short 1000px full-page; mobile/short enlarged text | Coherent dark/gold shell; normal-size headings, help and fields are readable. Both separate unchecked consent paragraphs, their policy links, and the £300 total/payment action remain visible without overlap. Enlarged short fields have the specific issue above. The order summary follows the form on mobile and sits alongside it on wider layouts. |
| Contact | Desktop/mobile/short full-page | Cards reflow coherently; the real email is readable, with no clipped card copy or overlapping header. Contact options are clear and consistent with the homepage. |
| Payment return | Desktop/mobile/short full-page | The unverified payment/application heading is prominent. The advice to contact Aesir before another payment, email and support action are readable. There is no visible successful-payment or fulfilled-application claim. |
| Homepage | Desktop/mobile/short full-page; original-size mobile application-details, suitability, recorded-generation, process and FAQ viewport images; short recorded-generation viewport | Overall section hierarchy, typography, colours and CTA treatment match the supporting pages. The £300 application-service fee is clear; suitability explains documented AC ratings. The historical generation example visibly names Premier Composites, Lincolnshire, 24 August 2026, Tigo transcription, 206.41 and kWh. Process/FAQ wording and links are readable in the viewport samples. No intersecting header/body text was visible in those samples. Full mobile footer requires the cross-check above. |

## Evidence limits

These screenshots use reduced motion. The “text200” capture script doubles the computed sizes of selected text/control elements; it is not an actual browser-zoom session or a complete operating-system text-scaling test. Some spans and legends retain their original sizes. The capture log records zero horizontal overflow, console warnings and page errors, but those log results are separate from this visual assessment; lack of page overflow does not prove native control text fits.

The very tall full-home images were reduced by the image viewer to 6000px high (mobile to 141px wide), so they were used for broad composition, supplemented with original-size section captures for readable text. This review does not establish keyboard behavior, hit testing, no-JavaScript behavior, dynamic suitability outcomes, failure recovery, motion continuity, physical-device performance, or payment/fulfilment operation. Those require their own tests and evidence.

Image directory: `/Users/nick/Projects/Aesir Solar/experience-stage1/docs/experience/stage-seven/site-captures/`.

## Root follow-up

The identified form issue is corrected in the candidate: both grids collapse at short widths and a bounded control-size observer also enables a single-column enlarged-text layout at wider widths. The application heading is now “Your installation details.” A new regression measures actual selected-option text width at doubled text sizes. Final recaptures and the ordinary mobile footer viewport check are recorded in the handoff; the earlier composite observation is not treated as a product defect without that check.

### Final enlarged-grid correction

The first reflow fix exposed a second issue during visual inspection: the inherited percentage grid gap became a vertical percentage after the layout changed to one column. That gap was excluded from intrinsic height and let the order summary overrun the footer. Single-column application layouts now use a fixed 40px gap. The regression checks actual order-summary, main and footer bounds at both enlarged widths, not merely horizontal overflow. The saved failing frame is in `site-review-before/`; final recaptures follow the corrected build. The ordinary mobile footer viewport is clean, so the earlier repeated hero strip in the very long homepage capture is a screenshot-compositing artifact.

Final saved-frame inspection confirms the 1000px / doubled-text order summary fits fully above the footer with a clear gap. The current full image is 1000×6206; its final 1900px were inspected at readable scale. The supply/date labels and separate consent paragraphs remain legible. `safari-native/` additionally records a limited native desktop Safari smoke; this does not expand this earlier screenshot-only audit into a complete cross-browser suite.
