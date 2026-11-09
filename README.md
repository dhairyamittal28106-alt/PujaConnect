# PujaConnect

**Your traditions, thoughtfully taken care of.**

PujaConnect is a mobile-first Hindu puja and pandit-booking marketplace prototype built with Expo SDK 58, React Native, TypeScript, and Expo Router for Android, iOS, and web.

## Current status

Supabase integration is implemented, but this repository does not include credentials or real marketplace records. Without valid Supabase credentials, the app runs a clearly labelled demo catalogue. With Supabase configured, the app reads live records and does not silently fall back to demo data. SMS delivery, the database migration, active catalogue content, pandit verification, and service assignments require project setup. Payments are not integrated.

## Features

- Branded splash screen, onboarding, and guest browsing
- Supabase Phone OTP authentication with persistent session restoration
- Live active puja categories and services, plus verified pandit listings
- Puja and pandit details with sample-only data clearly labelled in demo mode
- Four-step booking request flow with database-calculated prices and saved price snapshots
- Customer booking history, status details, and eligible cancellation
- Pandit profile registration, assigned booking inbox, accept/decline, and eligible completion actions
- Profile editing, support FAQs, loading states, empty states, and retryable errors
- Typed Supabase data services, SQL migrations, RLS, and database booking functions

## Requirements

- Node.js 22.13 or later for Expo SDK 58
- npm
- A current Expo Go compatible with SDK 58, or an Android/iOS development build

## Getting started

```sh
npm install
npm start
```

Use the Expo CLI prompt or QR code to open the app. Run on a specific target with:

```sh
npm run android
npm run ios
npm run web
```

## Supabase configuration

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Apply the migration in `supabase/migrations/`, configure Phone OTP and an SMS provider, then add active catalogue entries and review pandit profiles. Never put a service-role key or other privileged secret in the app.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for project setup, migration, SMS, pandit verification, and booking test instructions. Database RLS checks are in `supabase/tests/marketplace_security.sql` and require a local Supabase stack with Docker.

## Verification commands

```sh
npm run typecheck
npx expo-doctor
npx expo export --platform android
npx expo export --platform web
```

## Project structure

```text
app/                  Expo Router screens and routes
src/auth/             Persistent auth session context
src/components/       Shared interface and loading components
src/data/             Clearly labelled local demo catalogue
src/lib/              Typed Supabase client and database types
src/services/         Auth and marketplace data access
src/theme/            Shared design tokens
supabase/migrations/  Database schema, RLS, and booking functions
supabase/tests/       Database security checks
```

## Important limitations

- The app has no payment integration or administrator interface.
- Catalogue, verification, and pandit-service assignments require administrator setup.
- Booking time choices are request preferences, not real availability. An assigned pandit's overlapping accepted bookings are rejected by the database.
- Ratings and customer reviews are not stored in the database and are hidden in live mode.
- No credentials or real customer or pandit records are included in the repository.

## License

No license has been added yet. All rights are reserved by the repository owner unless a license is added.
