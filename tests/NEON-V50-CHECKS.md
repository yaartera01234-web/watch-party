# v50 Lobby Neon — LOCAL ONLY, not published

User approved the complete theme including bubbles, with original writing, layout and functionality unchanged and Default available.

- Added opt-in Lobby Neon to the EXISTING theme picker and matching Violet + Midnight bubble palette.
- Choosing Lobby Neon applies its matching bubble colors and remembers previous bubble choice. Leaving Neon restores that prior choice unless user explicitly selected a different bubble palette. Night Purple + Pink/Cyan remain exact original defaults.
- Existing saved themes are never auto-overwritten. Select 🎨 → Lobby Neon to activate.
- New CSS is scoped to selected theme/bubble attributes and contains only background, color, border-color and box-shadow declarations. No dimensions, text, typography, layout, gestures or navigation changes.
- Original markup/writing and all non-theme JavaScript are byte-identical to live v49, except synchronized build version50.
- Shared DM wallpaper images/state untouched. Call answer/decline and presence/check meaning retained. Lobby image/motion/balance untouched. Android/MPV untouched.

## Checks actually run
- Chromium theme suites at 344×727, 390×844, 768×1024 and 1024×768: default vs v49 computed style parity; measured width/height/font/padding/radius/text unchanged; Neon colors applied; reload persistence; exact restoration; previous custom bubble restoration; subsequent explicit bubble preference respected; shared wallpaper styles unchanged; answer/decline colors unchanged.
- Storage-blocked mode can switch on/off without exceptions. Previous bubble fallback also retained in memory.
- Static guard: outside theme picker, scoped CSS and build version, entire HTML is byte-identical to v49.
- 18 actual-source Chromium lobby scenarios passed (mock room/MQTT).
- Update version consistency/newer-only/duplicate guards passed; test now derives the next version rather than hardcoding50.

Isolated browser fixtures, not physical device/broker tests. No push or deployment. Fresh authorized publishing access required.
