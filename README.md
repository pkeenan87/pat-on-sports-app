# Pat on Sports (iOS)

Expo / React Native reader for [patonsports.com](https://patonsports.com). Native Markdown, no WebView. Contract with the site is the versioned JSON API under `/api/v1/`.

## Setup

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator (Xcode required). Bundle ID: `com.patonsports.app`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npx expo export
```

API base: `https://patonsports.com/api/v1/posts.json` and `/api/v1/posts/<slug>.json`.

## Phases (from `_plans/02-ios-app.md`)

| Phase | Work |
|---|---|
| 0 | Site: `/privacy`, `/support`, `/api/v1/*`, AASA file, tests |
| 1 | App scaffold, Latest + Archive + Article with native Markdown and Pros & Cons |
| 2 | Offline cache, image cache, prefetch |
| 3 | Audio: player, background, downloads, resume |
| 4 | Push: register endpoint, GitHub Action, broadcast function |
| 5 | Comments (after Plan 1) |
| 6 | Icon, screenshots, App Store Connect, TestFlight, review |

This repo is through **Phase 4** (push notification registration and deep links). Comments and store assets are later phases.

## Brand

- Navy `#0c2340`, red `#c8102e`, paper `#f7f5f1`
- Fonts: Barlow Condensed (display), IBM Plex Sans (body)
- No team or league logos in the app

## License

Private / unpublished until App Store release. Site content remains on patonsports.com.
