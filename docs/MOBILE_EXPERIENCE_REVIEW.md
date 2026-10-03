# Mobile experience review — 2026-10-03

The whole-house 3D overview remains the default. This pass improves phone loading,
typography and interaction while preserving High material detail on mobile and
Very High on desktop. Architectural measurements and the approved wall envelope
are unchanged.

## Changes

- Package variable Figtree and Newsreader fonts locally, with metric-adjusted
  fallbacks and optional font display to avoid a late font swap. The three font
  files total 142,836 bytes; source and licenses accompany them.
- Use a consistent type scale across the viewer and reference boards: 14px body,
  13px controls, 12px captions and an 11px minimum for small navigation labels.
  Informational metadata now has 4.73:1 contrast on the main light panel;
  phone sun-hour labels have 5.94:1 on the dark Controls panel.
- Reserve loading copy, wait feedback and image slots. Distinguish file download
  from first-frame preparation; show elapsed-wait and offline explanations.
  Keep the 2D plan escape link mounted across the viewer's loading phases.
- Paint scene feedback before the requested work, reveal after a rendered frame,
  and let newer requests, other tabs and browser history cancel queued navigation.
  Keep loading announcements outside the busy canvas region.
- Keep the cached viewer paused on other tabs. Opening Controls does not redraw
  the scene. Solid phone panels avoid filtering a changing WebGL framebuffer;
  the Controls header keeps its dismissal button available while scrolling.
- Adapt drawing resolution during movement and restore idle detail. Preserve
  geometry and PBR materials; retain filtered 1024px mobile sun shadows and the
  higher desktop shadow profile.

## Texture payload

Six color maps use WebP at the original 1K/2K dimensions. The ten measured core
maps, including unchanged normal and roughness maps, shrink from 15,213,341 to
9,495,495 bytes: 37.6% less transfer. Mean color-channel differences are
1.46–2.05 out of 255. This is a core texture comparison, not the entire scene's
download size. Reproduce it with `python3 scripts/optimize-viewer-textures.py`.

## Verified coverage

`/tmp/house-iphone-experience/report.json` records passing WebKit and Chromium
phone cases at 390 × 844, scale 3, with touch and reduced motion. Coverage includes
held downloads, honest file counts, the eight-second wait note, offline/reconnect,
44px touch targets, font behavior, High/Faster switching, rapid reversal,
Explore entry/return, room selection, tab cancellation and a paused cached viewer
across Plan, Mood, Materials, Products and Plants. It also checks 320px width and
a short landscape layout.

Both engines recorded identical loading-card bounds before and after wait copy
appeared, and zero extra scene frames for three Controls openings. The tested
living view linked every shader program (167/167 WebKit, 143/143 Chromium), with
no context loss or WebGL errors. The report contains no JavaScript or asset
errors. These counts are from the phone-experience run after the experimental
transition-preparation path was removed.

`/tmp/house-loading-final.log` records a separate pass for default 3D, first-frame
reveal, finished/Explore transitions, hidden labels and notes, progressive garden
detail, cached revisit, reduced motion and idle rendering. Optimization evidence
is in `/tmp/house-texture-optimization.json`. These are machine-local artifacts;
the verifier scripts provide repeatable checks.

## Final recheck

Pending: complete the final render/movement/lighting regressions, uncontended
production timing measurements and the final local production build. On the
development server, the phone-emulated movement trace recorded a 775 ms maximum
WebKit frame gap and a 66.7 ms Chromium maximum. This WebKit smoothness problem
still needs work; the development server and host GPU make these timings
diagnostic rather than representative of a physical iPhone. Controls caused
zero extra scene frames in three openings, but that alone does not establish
smooth movement.

These browser tests run on a Mac with phone emulation. They do not measure a
physical iPhone's GPU, memory, Safari thermal behavior or VoiceOver. The work
improves presentation and flow; it does not establish AAA game quality.
