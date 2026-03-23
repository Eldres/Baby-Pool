# Baby Pool

A baby guessing pool where friends and family submit predictions for a newborn's weight, length, and birth date. Built with Next.js 16, TypeScript, Tailwind CSS, and Firebase Firestore.

## Stack

- **Next.js 16** — App Router, TypeScript, API routes
- **Tailwind CSS v4** — custom pastel theme via `@theme`
- **Firebase Firestore** — real-time data, no auth required for guests
- **Zod** — end-to-end schema validation (shared client + server)

## Getting Started

1. Copy `.env.local` and fill in your Firebase config + admin password
2. Enable Firestore in your Firebase Console (test mode is fine to start)
3. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit `localhost:3000/admin`, log in, and click **Initialize Config** to seed the database

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## How It Works

- **Public (`/`)** — guests enter their name and guess the baby's weight, length, and birth date
- **Admin (`/admin`)** — password-protected panel to:
  - Set the baby's name, header text, and emoji
  - Enter actual birth results after the baby arrives
  - Toggle the results reveal so everyone can see who guessed closest

## Scoring

Once actual results are entered and revealed, each entry is ranked by combined error:

```
score = |weight_diff_g| + |length_diff_cm × 100| + |date_diff_days × 500|
```

Lower score = better guess.

## Deployment

Push to `main` — Vercel auto-deploys. Add all `.env.local` variables to your Vercel project's Environment Variables settings.
