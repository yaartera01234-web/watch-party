# v51 stronger Lobby Neon — LOCAL ONLY

Replaces the existing Lobby Neon palette, not a second theme. Uses approved stronger-shine sample colors: bright pink/violet/cyan controls, stronger luminous edges and soft glows, brighter outgoing bubbles and dark readable incoming surfaces. Current Neon selections persist automatically. Default remains unchanged and reversible.

Only Neon palette values, scoped paint-only CSS and synchronized HTML/wp-ver version changed. Original writing, markup, dimensions, fonts, layouts, navigation, theme-selection/rollback logic, shared DM wallpapers, player/sync and native Android/MPV are unchanged. No new animation or layout added; existing motion remains.

Verified:
- Four Chromium viewport suites (344x727,390x844,768x1024,1024x768): exact default restoration against v49, unchanged measured text/font/padding/radius/width/height, persistence and custom bubble restoration, shared wallpaper preservation, answer/decline colors, blocked-storage fallback.
- Test fixture now deterministically disables animations/transitions with adequate specificity; previous generic fixture rule lost against original !important transition rules and caused transient computed-style comparisons. Production transitions are untouched.
- All 18 lobby Chromium scenarios pass (room/MQTT mocked).
- Update checker/version consistency tests pass; HTML and marker both 2026-10-06-51.
- Independent source normalization against live v50 proves all content outside Neon paint/CSS and version is byte-identical.

No push/deployment. Fresh publishing access required. Not handset validation.
