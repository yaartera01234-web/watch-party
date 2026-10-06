# v52 four approved theme replacements — LOCAL ONLY

Same six theme slots. Lobby Neon and original Night Purple (user's Purple Lofi) data and Neon CSS are byte-identical to v51.
Replacements preserve stored theme keys:
- blue → Ocean Cyan
- emerald → Emerald Glow
- sunset → Sunset Rose
- amoled → Champagne Gold

Palette conversion matches the approved four-theme sample hues; matching bubbles included, with dark text on Ocean/Emerald/Gold bright outgoing surfaces and white text on the darker Rose gradient. New styles only use background/color/border-color/box-shadow. No typography, geometry, navigation, original UI writing, player, sync, native MPV, lobby art or shared-wallpaper logic edits. Only theme/palette labels are replaced/added in the picker.

Selecting a replacement applies its matching bubble palette, remembers the earlier bubble preference and restores it when leaving. Changing a bubble palette explicitly is respected. Cross-switching among four themes and Neon preserves the previous preference. Existing saved users of the four replaced keys receive matching bubbles once; later page reloads do not reset explicit choices. Existing Neon/Purple users keep their choices untouched.

Verification:
- tests/four-themes.cjs: 16 palette/viewport suites across 344x727,390x844,768x1024,1024x768. Six cards, labels, distinct palettes, original text/font/dimensions/radii/padding, selected-state persistence, Default rollback, cross-theme/custom-bubble restoration, once-only legacy migration for four keys, exact Neon/Purple rendered parity against v51, wallpaper preservation, call semantic colors and scoped paint-only CSS.
- tests/neon-theme.cjs: all four existing viewport suites pass, original default restoration against v49 and source isolation. Updated the authorized blue-theme behavior assertion: matching palette now applies, prior explicit preference restores on leaving.
- tests/lobby-v48.cjs: all 18 Chromium scenarios pass. MQTT/room operations mocked.
- tests/update-version.cjs: marker/build52 consistency and newer-only prompt guards pass.

Local browser fixtures, not physical devices. No push/deployment. Fresh publishing access required. Android files absent/unmodified; no APK needed for this web theme change.
