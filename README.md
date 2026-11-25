# Custom Loader Shuffle

By **MrKingJayDee**. A free companion plugin for CSS Loader's Custom Loader theme on Steam Deck. Choose a different custom GIF before each game launch, not midway through loading.

## Requirements

- Decky Loader
- CSS Loader (2.1.2 tested with earlier builds)
- Custom Loader theme by Midnight (1.3.2 tested with earlier builds), enabled with **Custom** selected
- Your own GIF files

## Installation

1. Download the plugin ZIP from the repository's Releases page when published.
2. In Decky, enable Developer Mode and install the ZIP using its developer menu. Uninstall any older test build first.
3. Add GIFs to `/home/deck/homebrew/themes/Custom Loader/images/Add Your GIFs Here/` and select one manually in Custom Loader.
4. Open Custom Loader Shuffle and enable Automatic shuffle.

## Controls

Automatic shuffle selects one GIF per game launch. Random mode avoids the previous plugin selection when possible; off uses alphabetical sequential order. The exact sequence position can reset on reboot. Added and removed files are detected by periodic scanning. Apply next GIF is a manual action intended for use when no game is running. It works even with automatic shuffle off. Other Steam loading screens may display the last chosen GIF, but do not trigger a new selection.

## Troubleshooting and limitations

Keep a known-good ZIP. If a dependency is missing or unavailable, the plugin is designed to let the game launch rather than block indefinitely. A five-second launch wait limit is used; an already-issued CSS Loader request cannot be cancelled, so a delayed refresh can still complete later. Avoid changing Custom Loader settings concurrently with a launch. The backend makes a one-time configuration backup (`config_USER.shuffle-backup.json`) and uses atomic replacement. Uninstalling leaves the last selected GIF in Custom Loader. Do not blindly restore an old backup if other theme settings have changed. Symlinked directories and files and hardlinked files are not supported. The fixed theme path targets standard Steam Deck installations. Private Steam/Decky APIs may change. No GIFs are bundled; no analytics or external network requests are implemented in this plugin.

## Development

`dist/index.js` is the readable frontend source and `main.py` is the Python backend. No compilation is required for the supplied ZIP. Run `node --check dist/index.js` and `python -m unittest discover -s tests -v` for local checks. The security-hardened candidate needs on-device regression testing before publication. See RELEASE-CHECKLIST.md.

## Credits

Custom Loader Shuffle is an independent companion, not affiliated with Valve, Decky or CSS Loader. Thanks to the Decky Loader and CSS Loader contributors and Midnight, creator of the Custom Loader theme. This project does not bundle their themes or GIF assets. MIT license for original project code; see LICENSE. Third-party rights and official store packaging requirements must be confirmed before submission.
