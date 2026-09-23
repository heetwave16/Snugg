# Snugg

Snugg is a private shared-memory app for college friend groups. This repository contains the first mobile foundation: a calm launch flow, mock Spaces, photo-first galleries, People and Profile screens, and an Expo Router navigation shell.

## Run locally

```sh
npm install
npm run start
```

Then press `i` for iOS, `a` for Android, or `w` for the web preview.

TypeScript can be checked with:

```sh
npm run typecheck
```

## Foundation boundaries

All content is local mock data in `data/mockData.ts`. There is intentionally no authentication, Supabase client, database, storage, upload flow, permissions, comments, reactions, or backend integration in this stage. The `theme/`, `components/`, `data/`, and `types/` directories are intentionally separated so those capabilities can be introduced later without reshaping the app shell.
