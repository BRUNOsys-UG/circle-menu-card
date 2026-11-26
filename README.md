# Circle Menu Card

[![hacs][hacs-image]][hacs-url]
[![GitHub Sponsors][gh-sponsors-image]][gh-sponsors-url]

![preview]

The Circle Menu Card is a custom Lovelace card for Home Assistant that allows you to create a circular menu of actions or shortcuts. This card provides a visually appealing way to access common actions or navigate to different parts of your Home Assistant dashboard.

### Features:
- **Customization:** Configure the icons, colors, and positions of the floating button and menu items to match your dashboard's theme.
- **Multiple Actions:** Each menu item can perform various actions, such as toggling lights, controlling media players, or navigating to specific dashboards.
- **Responsive Design:** The circular menu adjusts its position based on the configuration, ensuring compatibility with different screen sizes and layouts.

### Installation:

### [HACS](hacs) (Home Assistant Community Store)

1. Go to HACS page on your Home Assistant instance
1. Add this repository (https://github.com/BRUNOsys-UG/circle-menu-card) via HACS Custom repositories [How to add Custom Repositories](https://hacs.xyz/docs/faq/custom_repositories/)
1. Select `Frontend`
1. Press add icon and search for `Circle Menu Card`
1. Select Circle Menu Card repo and install
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd> / (<kbd>Shift</kbd> +) <kbd>⌘</kbd> + <kbd>R</kbd>)
1. Add circle-menu-card to your page

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=BRUNOsys-UG&repository=circle-menu-card&category=plugin)

### Manual

1. Download the 'circle-menu-card.js' from the latest [release][latest-release] (with right click, save link as)
1. Place the downloaded file on your Home Assistant machine in the `config/www` folder (when there is no `www` folder in the folder where your `configuration.yaml` file is, create it and place the file there)
1. In Home Assistant go to `Configuration->Lovelace Dashboards->Resources` (When there is no `resources` tag on the `Lovelace Dashboard` page, enable advanced mode in your account settings, and retry this step)
1. Add a new resource
   1. Url = `/local/circle-menu-card.js`
   1. Resource type = `module`
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd> / (<kbd>Shift</kbd> +) <kbd>⌘</kbd> + <kbd>R</kbd>)
1. Add circle-menu-card to your page

### Configuration:
Here's an example configuration for the Circle Menu Card:

```yaml
type: 'custom:circle-menu-card'
left: false # Position the menu on the left
icon: 'mdi:menu' # Floating button icon
button_color: '#3498db' # Button background color
icon_color: 'white' # Icon color
menu_background_color: '#3498db' # Menu background color
items:
  - icon: mdi:lightbulb
    alt: Lights on...
    action:
      action: call-service
      service: light.turn_on
      service_data:
        entity_id: light.living_room
  - icon: mdi:thermometer
    alt: Default Dashboard
    action:
      action: navigate
      navigation_path: /lovelace/0
  - icon: mdi:music
    alt: Music Control
    action:
      action: call-service
      service: media_player.media_play_pause
      service_data:
        entity_id: media_player.living_room
  - icon: mdi:fan
    alt: Fan Control
    action:
      action: call-service
      service: fan.turn_on
      service_data:
        entity_id: fan.living_room
  # More items may be configured in v2
```
### Options:

| Name                   | Description                                                                                           | Default Value                |
|------------------------|-------------------------------------------------------------------------------------------------------|------------------------------|
| `left`                 | Whether to position the menu on the left side of the screen                                           | `false`                      |
| `icon`                 | The icon to be displayed on the floating button                                                       | `'mdi:menu'`                 |
| `button_color`         | Background color of the floating button                                                               | var(--primary-color)         |
| `icon_color`           | Color of the icon on the floating button                                                              | var(--text-primary-color)    |
| `menu_background_color`| Background color of the menu                                                                          | var(--primary-color)         |
| `auto_close`           | Closes the menu after a timeout in milliseconds                                                       | ``                           |
| `json_config`          | Load an external json-file with the menu and items configuration                                      | ``                           |
| `item_active_color`    | When using call_service, this defines the background color of a menu item whose destination entity is 'positive'. | var(--accent-color)                           |
| `positive_states`      | Defines an array of 'positive' states for entities to be highlighted. | 'true', 'on', 'open', 'active', 'detected', 'occupied', 'unlocked', 'home', 'above_horizon', 'ready' |
| `items`                | Array of menu items. Each item should contain `icon`, `alt`, and `action` properties.                 | `[]`                         |
| `items[].icon`         | Icon for the menu item                                                                                | `''`                         |
| `items[].alt`          | Alt text for the menu item                                                                            | `''`                         |
| `items[].action`       | Action to be performed when the menu item is clicked. Can be either `'navigate'` or `'call-service'`. | `''`                         |
| `items[].action.navigation_path` | Path to navigate to if `action` is `'navigate'`                                                   | `''`                         |
| `items[].action.service`         | Service to call if `action` is `'call-service'`                                                   | `''`                         |
| `items[].action.service_data`    | Service data to pass if `action` is `'call-service'`                                              | `{}`                         |

### Usage:
1. Clicking the floating button toggles the visibility of the circular menu.
2. Each menu item performs a predefined action, such as controlling devices or navigating to other dashboards.

### Global configuration:
You can store the configuration in a JSON file to provide a global setup for all menus. Use json_config to load the configuration into the circle-menu-card instance.

Any additional parameters provided will override the parameters from the JSON configuration.


## Version 2: two concentric rings

Existing v1 YAML continues to work. The default bottom-right position, button and item sizes, primary disk expansion, 1–4 item coordinates, service calls, navigation and theme colors are retained. The second ring is opt-in. It expands **behind** the inner disk; both sets of actions remain accessible.

```yaml
type: custom:circle-menu-card
icon: mdi:menu
items:
  - icon: mdi:lightbulb
    entity: light.living_room
    action:
      action: toggle
  - icon: mdi:chevron-double-up
    alt: More actions
    action:
      action: expand
secondary:
  open: manual
  swipe_to_expand: true
  menu_background_color: '#175579'
  items:
    - icon: mdi:home
      action:
        action: navigate
        navigation_path: /lovelace/home
    - icon: mdi:shield-home
      action:
        action: more-info
        entity: alarm_control_panel.home
```

With `secondary.open: auto` (the default), both rings open with one tap. With `manual`, an `expand` action toggles the outer ring while the inner ring stays open. `swipe_to_expand: true` opens both rings by swiping inward from the main button, toward the center of the screen. All options are optional. Closing the main menu closes both rings.

### Additional card options

| Key | Meaning / default |
| --- | --- |
| `position` | bottom-right, bottom-left, top-right, top-left. Overrides the original `left` option if provided. |
| `button_size`, `item_size` | Pixel diameters; defaults are 3.5em and 3em. |
| `offset_x`, `offset_y` | Pixel distance from the selected screen edges; defaults to 1em. |
| `radius` | Requested item center radius in pixels; default 7em. Increased automatically where needed to prevent overlap. |
| `opening_angle` | Custom arc span in degrees, greater than 0 and at most 180. Without it, 1–4 items use the original coordinates; larger lists and the outer ring use an inward 80° span. |
| `safe_area` | Opt-in iOS safe-area offsets, default false. |
| `close_icon` | Default mdi:close. |
| `close_on_action` | Close after successful item action, default false (v1 behavior). |
| `haptic` | HA haptic feedback, false by default; true uses light, or supply an HA feedback type. |
| `tap_action`, `hold_action`, `double_tap_action` | Optional actions on the main button. Default tap opens/closes the menu. Hold threshold 500 ms; double-tap window 260 ms. |
| `item_background_color` | Optional default inactive item color. |
| `secondary` | Optional outer ring: items, open, swipe_to_expand, radius, item_size, opening_angle, menu_background_color, icon_color, item_background_color, item_active_color, positive_states. |

The outer ring radius is automatically increased enough to put its hit targets outside the inner disk. A larger number of items requires more screen space; on narrow displays, prefer a small number of frequently used inner actions and a compact outer ring. The card does not shrink touch targets or silently discard items to fit an arbitrarily large menu.

### Actions

Each item accepts the original `action` object, or `tap_action` (takes precedence), plus optional `hold_action` and `double_tap_action`.

| Action | Fields |
| --- | --- |
| `call-service` | Legacy `service`, `service_data`; optional `target` |
| `perform-action` | `perform_action`, optional `data`, `target` |
| `toggle` | `entity` on the item or action |
| `more-info` | `entity` on the item or action |
| `navigate` | `navigation_path`, optional `navigation_replace` |
| `url` | HTTP(S) `url_path`, opens a new tab |
| `menu` | Toggle the entire menu |
| `expand` | Toggle the outer ring |
| `none` | No action |

An optional `confirmation` (boolean or object with text and user exemptions) uses a browser confirmation dialog. Haptic feedback is forwarded to Home Assistant; availability depends on the client. Actions and their failures use the connected HA instance; no additional dependencies or services are needed.

### Entity states, conditions and badges

An explicit `entity` is preferred, but the card also recognizes entity IDs from legacy service data, modern action data or target. Multiple targeted entities highlight the item when any is in a positive state. State overrides are keyed by the first entity's actual state. Missing/unavailable entities do not throw. Item colors, `positive_states`, `close_on_action` and `haptic` can be overridden per item.

```yaml
items:
  - icon: mdi:lightbulb-outline
    entity: light.living_room
    action:
      action: toggle
    icon_color: white
    active_color: orange
    states:
      "on":
        icon: mdi:lightbulb-on
        background_color: '#f9a825'
      unavailable:
        icon: mdi:alert-circle-outline
    conditions:
      - condition: state
        entity: binary_sensor.living_room_available
        state: "on"
    badge:
      entities:
        - light.living_room
        - light.kitchen
      positive_states: ["on"]
      hide_zero: true
```

Conditions support `state` (`state` / `state_not`, optional attribute), `numeric_state` (above/below, optional attribute) and nested `and`, `or`, `not` groups. Top-level conditions are ANDed. Badges accept static text/numbers, `{entity, attribute}`, or `{entities, positive_states}`, plus `hide_zero`, `color`, `background_color`. State overrides can also set alt, icon_color and badge.

### Editor and external configuration

Use the visual editor to configure both rings, add/remove/reorder items, select icons/entities/actions via Home Assistant selectors (when available), choose colors, and enter advanced state/condition/badge configuration as JSON. YAML remains fully supported. When using `json_config`, inline top-level keys override the fetched JSON, including the entire `items` or `secondary` value; the editor changes inline configuration only. External JSON is fetched once per configured URL per card instance, with error handling and cancellation on reconfiguration/disconnect.

### Development and tests

The production card is a single dependency-free JavaScript file, directly installable as a Lovelace resource. No bundler is required.

```sh
npm test
python3 -m pip install playwright
python3 -m playwright install chromium webkit
python3 tests/browser.py
```

The browser suite compares v2 geometry with the original v1 source at commit `adee52fb1086c7f63b6f4a1b6408a972ace38cd3` and exercises both rings, actions, state, gestures, external JSON and editor behavior in Chromium and WebKit using a mocked HA interface. A running Home Assistant instance is not required by the automated suite.

### Credits:
- The Circle Menu Card is inspired by various circular menu implementations and is built as a custom Lovelace card for Home Assistant.

### Issues & Contributions:
If you encounter any issues or have suggestions for improvements, feel free to [open an issue](https://github.com/BRUNOsys-UG/circle-menu-card/issues) or submit a pull request.

## License

MIT © [Benedikt Hübschen][bhuebschen]

<!-- Badges -->

[hacs-url]: https://github.com/hacs/integration
[hacs-image]: https://img.shields.io/badge/hacs-custom-orange.svg?style=flat-square
[gh-sponsors-url]: https://github.com/sponsors/bhuebschen
[gh-sponsors-image]: https://img.shields.io/github/sponsors/bhuebschen?style=flat-square

<!-- References -->

[preview]: https://github.com/BRUNOsys-UG/circle-menu-card/assets/1864448/39352877-43fa-49ce-a517-079e3783a95d
[home-assistant]: https://www.home-assistant.io/
[hacs]: https://hacs.xyz
[latest-release]: https://github.com/BRUNOsys-UG/circle-menu-card/releases/latest
[ha-scripts]: https://www.home-assistant.io/docs/scripts/
[edit-readme]: https://github.com/BRUNOsys-UG/circle-menu-card/edit/master/README.md
