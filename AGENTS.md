# Pat on Sports app — working rules

Expo SDK 57 / React Native 0.86. Read the versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before adding or changing native modules.

## Non-negotiables

- **No WebView, ever.** Articles render natively from Markdown and the
  Pros & Cons JSON. App Store guideline 4.2 is the reason.
- **No team or league marks.** No Patriots, NFL, UCLA or NCAA logos in the
  icon, screenshots, or UI. Brand is the wordmark and palette only.
- **One phase per task.** Phases are listed in README.md. Deliver the phase you
  were given and stop; do not start the next one.
- **The site owns the content contract.** `src/lib/api.ts` is a copy of
  `pat-on-sports/src/lib/api.ts`. Change it there first, then copy it here.

## Brand

- Navy `#0c2340`, red `#c8102e`, paper `#f7f5f1`, UCLA blue `#2774ae`.
- Display font Barlow Condensed, body font IBM Plex Sans, via
  `@expo-google-fonts/*`. Tokens live in `src/theme/colors.ts`.

## Checks before pushing

```bash
npm run lint
npm run typecheck
npm test
npx expo export --platform ios
```

CI runs all four plus `npm audit --audit-level=critical`. The audit is at
critical rather than high because the Markdown renderer pins markdown-it 10,
whose linkify-it dependency has high ReDoS advisories with no upstream fix.
The app renders only the author's posts, never user input. Raise the level
when linkify-it ships a patch.
