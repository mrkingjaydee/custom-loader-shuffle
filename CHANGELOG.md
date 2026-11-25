# 1.0.0 (security-hardened release candidate)

- Maintainer metadata: MrKingJayDee.
- Preserve tested interface, mode and GIF selection algorithm.
- Reject symbolic links and nonregular/hardlinked files; use directory-relative atomic configuration updates and exclusive backup creation.
- Detect concurrent configuration changes before replacement.
- Bound launch wait to five seconds and log apply errors. Already-issued RPCs cannot be cancelled.
- Add backend regression tests and documentation. Device regression testing pending.
