# PujaConnect

**Your traditions, thoughtfully taken care of.**

PujaConnect is a mobile-first prototype for discovering Hindu pujas and sample pandit profiles, then walking through a clear booking request flow. It is built with Expo, React Native, TypeScript, and Expo Router for Android, iOS, and web.

## Current status

This repository contains a front-end prototype backed by local sample data. It is not connected to a booking backend, payment provider, authentication service, real availability, or verified pandit records. Prices, ratings, reviews, profiles, locations, and date slots are illustrative. The booking flow ends with an explicit unconfirmed request preview; it does not place a booking or take payment.

## Features

- Branded splash and three-step onboarding
- Guest browsing and phone/OTP interface clearly marked as a demo
- Home screen with ceremony discovery and sample listings
- Explore screen with search, category filters, and location context
- Puja detail pages with ceremony description, duration, languages, inclusions, exclusions, and sample profiles
- Sample pandit profiles with experience, languages, service area, specialisations, and indicative dakshina
- Four-step booking request preview for date, time, address, language, samagri, and review
- Unconfirmed booking preview with no payment processing
- Upcoming, completed, and cancelled booking views
- Profile, help, and FAQ screens
- Shared design tokens and reusable UI components

## Requirements

- Node.js 22.13 or later for Expo SDK 58
- npm
- Expo Go compatible with SDK 58, or an Android/iOS development build

## Getting started

```sh
npm install
npm start
```

Use the Expo CLI prompt or the QR code to open the app on a compatible device. For a specific target:

```sh
npm run android
npm run ios
npm run web
```

## Checks

```sh
npm run typecheck
npx expo-doctor
npx expo export --platform android
npx expo export --platform web
```

## Project structure

```text
app/
  (tabs)/            Home, Explore, Bookings, Profile
  booking/            Booking flow and unconfirmed request preview
  pandit/             Pandit profile route
  puja/               Puja detail route
  auth.tsx            Guest-first sign-in demo
  onboarding.tsx      Onboarding sequence
  otp.tsx             OTP demo screen
  splash.tsx          Brand splash screen
  support.tsx         FAQs and support information
src/
  components/         Shared visual components
  data/               Local sample catalogue
  theme/              Design tokens
```

## Configuration and integrations

- Expo app configuration: `app.json`
- TypeScript and import aliases: `tsconfig.json`
- App entry and navigation: `app/_layout.tsx`
- Sample catalogue: `src/data/catalog.ts`
- Shared colours and spacing: `src/theme/tokens.ts`

Before launch, connect a backend for catalogue and availability data, persist booking requests, add an authentication provider and a payment provider, and replace all sample pandit, rating, location, and pricing content with reviewed real data. Add customer support operations and publish clear cancellation and privacy policies before accepting payments or bookings.

## License

No license has been added yet. All rights are reserved by the repository owner unless a license is added.
