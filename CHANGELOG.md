# 2.0.0

- Preserve the original one-ring menu and configuration; add an opt-in concentric outer ring with automatic, manual and swipe opening.
- Add configurable geometry, additional positions, item colors, entity state overrides, conditions, badges, HA actions and optional gestures.
- Add a visual configuration editor with native HA selectors and editable ring items.
- Fix closed-state close icon, action duplication, timers, lifecycle, external JSON races/errors and duplicate entity highlights; remove unsafe dynamic HTML interpolation.
- Add dependency-free logic tests and browser regression tests for the original geometry.

### [1.0.3](https://github.com/bhuebschen/circle-menu-card/compare/v1.0.2...v1.0.3) (2024-05-27)

* Menu items can show the state of an entity
* 'positive' entities can have a custom color
* Configuration can be stored in /www and loaded with 'json_config'.
* 'Visual Editor' shows JSON-Configuration.
* 'positive States' can be customized

### [1.0.2](https://github.com/bhuebschen/circle-menu-card/compare/v1.0.1...v1.0.2) (2024-05-24)

* Menu item positions are now calculated.
* Clicking outside the menu now closes it.
* The floating button now displays an "x" to indicate the close behavior upon clicking.
* Default colors now follow the theme-based colors.
* Added the "auto-close on timeout" feature (thanks to @ngocjohn).

### [1.0.1](https://github.com/bhuebschen/circle-menu-card/compare/v1.0.0...v1.0.1) (2024-05-22)

* Made Circle-Menu-Card discoverable in the "ADD CARD" list.
* Removed blurry edge on Safari.
* The card now provides a stub configuration when added to the dashboard.

### 1.0.0 (2024-05-22)

Initial release
