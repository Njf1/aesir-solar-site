# Earth asset provenance — stage 2

Prepared 8 September 2026. The globe is a cinematic scientific illustration. It combines historical surface and cloud composites and authored lighting; it is not a single dated satellite observation or a live weather view.

The detailed machine-readable record, SHA-256 hashes, transforms and decoded-memory estimates are in `earth-assets.json`. `optimize-earth-assets.py` reproduces the delivery variants when pointed at the downloaded source directory and an output directory. Source masters are under the temporary `sources/` directory and must stay outside the served build.

| Delivered file | Dimensions | Transfer |
| --- | --- | --- |
| `earth-day-4096.webp` | 4096 × 2048 | 566,958 bytes |
| `earth-day-2048.webp` | 2048 × 1024 | 137,856 bytes |
| `earth-clouds-2048.webp` | 2048 × 1024 | 336,230 bytes |
| `earth-clouds-1024.webp` | 1024 × 512 | 101,690 bytes |

A selected desktop day/cloud pair transfers **903,188 bytes**; mobile transfers **239,546 bytes**. Expected RGBA8 decoded pixels are **40 MiB desktop / 10 MiB mobile**. A full RGBA8 mip chain is approximately **53.33 MiB desktop / 13.33 MiB mobile**, excluding render targets, driver overhead and retained copies. These are allocation estimates, not measured phone memory. WebP reduces transfer size; it is not GPU block compression.

## Source and usage verification

**Day:** NASA Blue Marble: Next Generation, July 2004 base map, by Reto Stöckli. Required credit: **NASA Earth Observatory**. The [project description](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) and [base-map download index](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/) were verified live. [Exact downloaded image](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x5400x2700.jpg). This base variant has no baked topography lighting or bathymetry; deep-ocean color is uniform in the NASA source.

**Clouds:** NASA Blue Marble: Clouds, by **Reto Stöckli / NASA Goddard Space Flight Center**, with enhancements credited to Robert Simmon. [Exact downloaded image](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg). The [legacy image record](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l) redirects after NASA's site migration. Its image-specific description and credit were verified through the search-index copy of that official record; the source image itself still downloads from NASA. The record describes freely available imagery and identifies no third-party copyright owner for this image.

[NASA's current media-use guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) was verified live: use must acknowledge NASA and must not imply endorsement; third-party copyright exceptions require separate rights. These selected images show no NASA logos or people, and no third-party restriction was identified in their records. The experience must not claim NASA endorsement.

## Rendering and orientation

The delivery images retain the sources' full north-up equirectangular extent: longitude −180° at left, 0° at center, +180° at right. Latitude +90° is at the top. No crop, rotation, flip or artistic color grade was baked into the day maps. They were Lanczos resized and WebP encoded at quality 88/84, method 6, with metadata stripped. Clouds were converted to luminance density and encoded at quality 70, method 6; the mobile variant was Lanczos resized.

Load day maps as sRGB color, clouds as linear/no-color-space data. Cloud WebPs carry grayscale in RGB, **not an alpha channel**: use `.r` or an `alphaMap` for opacity. Keep the cloud layer independent from surface color so illumination and the terminator remain coherent.

With standard Three.js `SphereGeometry` and `TextureLoader`'s default `flipY=true`, Greenwich sits on local +X, 90°E on −Z and north on +Y. A Y rotation of −π/2 puts Greenwich toward a camera on +Z. Elevate the camera to show Europe usefully. Britain near 54°N, 2°W is approximately local direction `(0.587, 0.809, 0.0205)` before mesh rotation. These coordinate notes are implementation calculations; verify the final globe in the renderer.

Final renderer transformations: image decoding uses `imageOrientation: flipY`; the globe rotates +π/2 around Y so Greenwich faces the incoming camera on −Z. The camera settles above the equator with Europe near the upper limb. Daylight shading, a restrained blue ocean tint, a separate cloud shell and procedural atmosphere are authored in GLSL; the source rasters themselves are not colour graded.
