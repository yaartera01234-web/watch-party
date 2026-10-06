# v49 repeat-update prompt correction — LOCAL ONLY

Root cause verified against public live files: WP_BUILD=2026-10-06-48, wp-ver.txt=2026-10-06-47. The previous checker treated any unequal marker, including an older one, as a new update. The v48 publication omitted updating/verifying wp-ver.txt.

Correction: both files now use 2026-10-06-49. The checker and UI require a strictly newer parsed numeric build. Equal, older and malformed markers do not generate a prompt. Existing cache-busting update action and background/offline guards retained. No automatic reload, session disruption or permanent suppression of future genuine updates.

Validation: node tests/update-version.cjs passes source/marker consistency, 11 comparison cases (numeric suffix/date transitions/malformed values), repeated installed/older marker responses, genuinely newer response, background/no-fetch, offline/non-OK HTTP, and actual UI duplicate guard. Fetch/UI are mocked; not device tests.

A source comparison confirms all code outside the updater/check function is byte-identical to approved v48, including phone/tablet lobby, join/chat/sync and sleep timer. v48 layout previously passed Chromium tablet 768x1024 and landscape 820x390. No new tablet changes made.

Fresh verification of delivered Music-Watch-Party-MPV023-TEST1.apk: all nine donor native-library hashes match the pinned Synkplay Android v0.23.0 manifest. That app release contains MPV v0.41.0-252-gc401ef9c3; 0.23.0 is its app release, not the internal MPV version. Original app logic remains ours, bridge relinked as documented. Android files not modified by this correction.

No push/deployment performed. Fresh publishing authorization/access required; prior token not reused.
