# Lobby v48 — balanced responsive layout (LOCAL ONLY)

- Replaced single tall artwork plus stretched decorative tail with six proportional art sections.
- Surplus viewport height is distributed across six weighted gaps. Heading/couple move down, room and Enter gain breathing space; compact footer stays at the bottom on tall phones.
- Section assets are extracted from the existing self-contained balanced preview (no new artwork or proportions).
- Real room name, Back → Chat, explicit Enter, existing motion, reduced motion and error handling retained.
- Source comparison confirmed everything outside scoped lobby CSS, lobby markup and build version is byte-identical to v47.
- Native Android/MPV files untouched. No push/deployment performed.

## Verification
18 actual Chromium scenarios passed using tests/lobby-v48.cjs:
first-screen guard; active motion/no auto-join; Back from inbox and calls; single explicit entry; offline and failed-entry handling; history denial; safe long/dynamic room names and reopen; rapid Back/Enter race; membership preservation; reduced motion; responsive 360×780, 768×1024 and 820×390; balanced 344×727, 360×800 and 412×915.
Tall-phone checks assert unaltered image ratios, heading shifted down, compact footer aligned to viewport bottom, no tail filler and no vertical/horizontal overflow.
Room/MQTT/DM operations are mocked; not handset/broker tests.
Inspected actual-source 344×727 rendering.

Build: 2026-10-06-48. Requires fresh authorized publishing access before going live.
