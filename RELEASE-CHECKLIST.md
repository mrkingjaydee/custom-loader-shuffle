# Release checklist

- Prior revised candidate: owner tested sequential/random, dynamic GIF lists, controller navigation, scroll reset, persistent independent toggles and automatic switching after reboot.
- Hardened candidate: local backend tests cover normal writes, backup, symlink and path rejection, concurrent-change detection, preferences and missing config. Syntax checked.
- Device regression required: normal shuffle in both modes, disabled mode, manual apply, reboot preferences, empty/one GIF, missing/disabled theme and missing CSS Loader. Test normal game launch after a timeout if practical.
- Limits: already-started RPC calls cannot be cancelled; concurrent external config changes are detected before replacement but not fully synchronized with CSS Loader. No independent privileged-filesystem audit. Private APIs and nonstandard home directories remain compatibility risks.
- Confirm MIT licensing and third-party provenance, then publish source and ZIP. Official Decky Store build/metadata and review requirements are a separate step; not yet validated.
