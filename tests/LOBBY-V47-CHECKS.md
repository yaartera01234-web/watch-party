# Lobby v47 — tall-screen footer correction

User screenshot showed a large plain dark area below the width-scaled lobby artwork.
The image's fixed aspect ratio was shorter than the available Android viewport.

Changes are strictly limited to:
- Lobby content is a min-height100% flex column; original scene is non-shrinking.
- An aria-hidden/non-interactive decorative wave continuation fills remaining height.
- The SVG top colors match the original image's last row and blend into smooth waves.
- Original photo, text, control positions, scene proportions and all actions unchanged.
- Version identifiers bumped to2026-10-06-47.

18 actual Chromium scenarios pass using existing actual-source lobby harness:
all15 v46 navigation/motion/error/size scenarios plus tall phone344x727 (equivalent
proportions to reported screenshot),360x800,412x915. Assertions verify image ratio,
footer reaches viewport bottom, no horizontal/extra vertical overflow on those phones,
and footer cannot intercept touches. Room/MQTT operations are simulated, not real
brokers or physical phone testing. Screenshot inspected. Reduced motion retained.

Source reconstruction proves all HTML outside added footer CSS, single decorative
node and build identifier is byte-identical to live v46. No navigation, membership,
sync, fullscreen, native APK, source resolver or player changes.

LOCAL ONLY at preparation. Not pushed; fresh deployment authorization/access required.
