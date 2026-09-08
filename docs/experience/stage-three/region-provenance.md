# Expanded regional context

Prepared **8 September 2026** from the previously downloaded and verified Natural Earth sources. This expands neighboring land beyond the broad regional frame, keeping Britain and Ireland unchanged.

- Delivery: `region-land-expanded.json` — **503,245 bytes raw / 175,991 bytes gzip**.
- Bounds: **longitude −24°..25°, latitude 35°..72°**.
- Geometry: **389 polygons / 21,519 vertices**.
- Great Britain: **3,219 vertices**, record and coordinates exactly copied from the initial delivery.
- Ireland: **1,956 vertices**, record and coordinates exactly copied from the initial delivery.
- All ten landmark containment IDs remain unchanged.

The schema matches `region-land.json`. The stable IDs `great-britain` and `ireland` are preserved. Other context IDs use `context-expanded-NNN`. Only load one regional delivery into the scene.

Other cropped mainland was simplified at an approximate 700 m tolerance, other islands at 1,000 m, preserving topology. A total of 655 islands smaller than approximately 15 km² were omitted from this wider context. Sizes and tolerances use the same local approximation, `x = longitude × 111.32 × cos(54°)`, `y = latitude × 111.32`; they are visualization scales rather than surveyed geographic accuracy. Coordinates are returned to longitude/latitude and rounded to six decimals. Every final polygon validates successfully.

Rectangular crop boundaries still exist at the larger extent. `clippedAtBounds` identifies affected polygons; do not emphasize artificial crop segments as coastline. The larger crop is intended to place these edges outside the actual Britain camera composition.

Sources remain **Natural Earth 1:10m land v5.1.1**, with **populated places simple v5.1.2** for reference points. See [land source](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/), [place source](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/), and [public-domain usage terms](https://www.naturalearthdata.com/about/terms-of-use/). Download date, exact URLs, hashes, creator credits and processing are recorded in [region-provenance.json](region-provenance.json); no new third-party source has been introduced. Credit: **Made with Natural Earth.**

`build-expanded.py` reproduces this variant after the initial delivery. `region-expanded-preview.png` is a diagnostic geographic plot, not a shipped visual asset. This source remains physical coastline only; any terrain, roof or electrical infrastructure is separately authored and explicitly illustrative.

## Final repository transformation

The expanded JSON is served as `src/experience/assets/region-land.json` after Vite hashing; no source ZIP, shapefile, place dataset or full-resolution master is shipped. `region.ts` triangulates the rings, projects them into the shared local convention, assigns original muted land colour/noise, and fades peripheral context before the rectangular crop can enter the frame. The Great Britain outline uses the same longitude/latitude ring on the NASA globe and local mesh. This is a cartographic coastline illustration, with no claimed terrain elevation. The site location in `geography.ts` is only an illustrative Midlands transition origin, not a customer address.

The processing manifest's deterministic gzip-9 figure and Node's build-measured gzip figure use different encoders/settings; the final [build size record](../asset-sizes.json) is the enforced delivery measurement. The local preview sends uncompressed bodies, so actual network measurements separately report the 503,245-byte JSON transfer body.
