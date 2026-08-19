# Changelog

All notable changes to OpenInvest are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-08-19

This is the current public presentation. Allocation is structure, cost versus market is a ruler, names and prices stay in type.

### Added

- GitHub Pages deploy and a weekday Flex sync Action. Secrets stay in GitHub Actions, not in the repo.
- Light cyclorama stage: same-height volumes, width follows market weight. Drag to inspect, click to pin; the ledger stays in sync. `prefers-reduced-motion` uses equal-height bars with the same mapping.

### Changed

- Replaced the frosted-glass dashboard with a layered page: 3D for allocation, one ruler for cost versus market, type for identity, statement date for time.

## [0.2.0] - 2026-08-18

### Added

- Phone and desktop layouts, including safe-area padding and compact holding rows.
- Split English / Chinese type: Geist + Instrument Serif for Latin, PingFang SC for CJK, no Latin tracking on Chinese copy.
- README, changelog, and a `npm version` gate that requires the new version to appear in this file.

### Changed

- Public book numbers use tabular figures in the UI sans instead of a monospace face, so Chinese labels are not forced into a Latin mono.

## [0.1.0] - 2026-08-18

### Added

- Public Interactive Brokers book from a delayed Flex snapshot.
- Daily close sync (`npm run sync`) writing `data/public.json` without account numbers.
- Same-page English | 中文 switch.
- Static Next.js export and a clear-glass layout.
