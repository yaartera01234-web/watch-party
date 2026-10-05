# Lobby v46 — local integration checks, 2026-10-06

User approved the supplied neon lobby sample and visible music-note/beat-bar/button-shine
motion. Requested replacing the sample's top-right hamburger with a Back arrow to Chat.

- New 184,116-byte WebP: phone status strip removed; baked-in hamburger, Sara and old
  footer status removed. Actual room name and status render as DOM text.
- Sample layout retained. Actual Enter Party button overlays the painted CTA. Explicit
  top-right arrow goes to DM inbox (Chat), including when opening lobby from Calls.
- Arrow does not call room enter/leave. Existing membership preserved. Enter remains
  explicit, retains tower/connectivity guard, duplicate guard and welcome behavior.
- Dynamic room name uses textContent + ellipsis, not HTML. Keyboard focus semantics,
  accessible button names, safe areas and reduced-motion preference are retained.
- Visible note/beat/shine CSS animations; no looping video or animated GIF asset is loaded.
- Every selector is scoped to #wp-party-lobby. Other HTML, sync/fullscreen/call/messaging
  code is byte-identical to v45 after excluding the lobby CSS/logic and WP_BUILD.
- WP_BUILD/wp-ver.txt: 2026-10-06-46. No APK/source/native changes required.

## Tests actually run
15 Chromium scenarios passed using actual production lobby functions/CSS and artwork:
first-page guard; visible motion and right arrow; inbox/Calls arrow return to Chat;
Enter exactly once + welcome; offline and rejected entry; denied history.pushState;
reopen/dynamic hostile/long room name; rapid Back/Enter race; already-joined membership;
reduced motion; 360x780, 768x1024 and 820x390 layouts with no horizontal overflow.
The tests use simulated DM/room/MQTT functions, not real brokers or a handset.
All 9 inline JavaScript blocks passed node --check; git diff --check passed.

Two harness/layout corrections during testing: clip drifting notes to avoid small-phone
horizontal overflow; explicitly UTF-8-decode test fixture to avoid mojibake (production
already had UTF-8). Rerun passed all15 scenarios. Native browser screenshots inspected.

To rerun: install Playwright outside the release tree or provide PLAYWRIGHT_MODULE;
optionally provide CHROMIUM_PATH; run node tests/lobby-v46.cjs. No production dependencies
were added. Public network/room traffic is mocked and no sign-in credentials are used.

## Publication state at preparation
LOCAL ONLY, NOT PUSHED. Fresh GitHub push access is required; no old token reused.
Production remains v45 until a later authorized push and successful Pages deployment.
