# Custom Loader Shuffle

By **MrKingJayDee**. A free companion plugin for CSS Loader's Custom Loader theme on Steam Deck. Choose a different custom GIF before each game launch, not midway through loading.

## Requirements

- Decky Loader
- CSS Loader (2.1.2 tested with earlier builds)
- Custom Loader theme by Midnight (1.3.2 tested with earlier builds), enabled with **Custom** selected
- Your own GIF files

## Installation

1. Download the plugin ZIP from the repository's Releases page.
2. In Decky, enable Developer Mode and install the ZIP using its developer menu.
3. Add GIFs to `/home/deck/homebrew/themes/Custom Loader/images/Add Your GIFs Here/` and select one manually in Custom Loader.
4. Open Custom Loader Shuffle and enable Automatic shuffle.

## Controls

Automatic shuffle selects one GIF per game launch. Random mode avoids the previous plugin selection when possible; off uses alphabetical sequential order. The exact sequence position can reset on reboot. Added and removed files are detected by periodic scanning. Apply next GIF is a manual action intended for use when no game is running. It works even with automatic shuffle off. Other Steam loading screens may display the last chosen GIF, but do not trigger a new selection.

## Troubleshooting and limitations

- Ensure CSS Loader and the Custom Loader theme are installed and enabled.
- If a dependency becomes unavailable, the plugin is designed to allow games to launch rather than block indefinitely.
- A five-second launch timeout is included. A delayed CSS Loader refresh may still complete afterward.
- Avoid changing Custom Loader settings while launching a game.
- Your original Custom Loader configuration is automatically backed up. Restoring an older backup may overwrite subsequent theme settings.
- Uninstalling the plugin retains your last selected GIF.
- Standard Steam Deck installation paths are required. Symbolic links and hardlinked files are not supported.
- Future SteamOS or Decky updates may affect compatibility.

**Privacy:** No analytics, user tracking or external network requests are implemented. No GIFs are bundled with the plugin.

## Development

`dist/index.js` contains the frontend source code, and `main.py` contains the Python backend. No compilation is required for the supplied installation ZIP.

For local testing, run `node --check dist/index.js` and `python -m unittest discover -s tests -v`.

## Credits

Developed and maintained by **MrKingJayDee**.

Special thanks to:
- Midnight (midnightgospel), creator of the Custom Loader theme.
- The CSS Loader and Decky Loader developers and contributors.

Custom Loader Shuffle is an independent companion plugin and is not officially affiliated with Valve, Decky Loader or CSS Loader.

The original project code is released under the MIT License. See LICENSE for details.
