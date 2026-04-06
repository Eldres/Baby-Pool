# Baby Pool

A baby guessing pool where friends and family submit predictions for a newborn's weight, length, and birth date. Built with Next.js 16, TypeScript, Tailwind CSS v4, and Firebase.

## Stack

- **Next.js 16** — App Router, Server Actions, error/loading boundaries, `next/image`
- **React 19** — `useActionState`, `useFormStatus`, Server Components
- **Tailwind CSS v4** — custom pastel theme via `@theme` tokens in `globals.css`
- **Firebase** — Firestore (real-time data), Auth (Google SSO for admin), Storage (QR code uploads)
- **Zod** — end-to-end schema validation shared between client and server
- **TypeScript** — strict mode, types inferred from Zod schemas

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file and fill in your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ADMIN_EMAIL=your-email@gmail.com
   NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com
   ```

3. Enable **Firestore**, **Authentication** (Google provider), and **Storage** in your Firebase Console.

4. In Firebase Console → Authentication → Settings → Authorized domains, add your production domain (e.g. `your-app.vercel.app`).

5. Deploy Firebase rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

6. Apply CORS config for Storage uploads (one-time, requires [gcloud CLI](https://cloud.google.com/sdk/docs/install)):
   ```bash
   gcloud storage buckets update gs://YOUR-BUCKET.firebasestorage.app --cors-file=cors.json
   ```

7. Start the dev server:
   ```bash
   npm run dev
   ```

8. Visit `localhost:3000/admin`, sign in with your authorized Google account, and click **Initialize Config** to seed the database.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Features

### Public Page (`/`)
- Guess form with imperial/metric unit toggle (metric values converted server-side)
- Conditional birth date guess field (configurable from admin)
- Real-time leaderboard with scoring when results are revealed
- Gold/Silver/Bronze podium display for top 3 guesses in a pyramid layout
- Actual results card showing the real weight, length, and birth date
- Scoring guide side panel explaining the point deduction system
- Guess spread summary showing highest/lowest weight and length guesses with guesser names
- Venmo QR code panel with configurable message and "Support with Venmo" payment link button
- CSV export of all entries
- Skeleton loading states while Firestore data loads
- Error boundaries with retry on both routes
- Responsive mobile layout with adaptive padding
- ARIA-accessible tab navigation and screen reader alerts
- Decorative floating bubble animations
- SEO metadata on all pages

### Admin Panel (`/admin`)
- Google SSO login (restricted to a single authorized email)
- Configure baby name, header text, emoji, and due date
- 3-state toggle for birth date guess visibility (auto / always shown / always hidden)
- Upload Venmo QR code via Firebase Storage with configurable caption, message, and payment link URL
- Enter actual birth results (weight, length, date) — values persist across sessions
- Toggle results reveal for the public leaderboard (disabled until actual results are saved)
- Skeleton loading state during auth check

## Scoring

Everyone starts with **10,000 points**. Points are deducted based on how far off each guess is:

| Category | Rate | Example |
|----------|------|---------|
| Weight | −125 pts per oz | 4 oz off = −500 pts |
| Length | −635 pts per in | 0.5 in off = −318 pts |
| Date | −500 pts per day | 2 days off = −1,000 pts |

The categories are balanced so that a typical close miss in any one costs roughly the same (~500 pts). Highest score wins. Entries without a birth date guess skip the date component. Scores are floored at 0.

## Deployment

Push to `main` — Vercel auto-deploys. Add all `.env.local` variables to your Vercel project's Environment Variables settings.

### Firebase Setup Checklist
- [ ] Firestore: enabled with security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Authentication: Google provider enabled, Vercel domain added to authorized domains
- [ ] Storage: enabled, rules deployed (`firebase deploy --only storage`), CORS configured via `gcloud`
