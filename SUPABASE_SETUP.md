# Supabase setup for PujaConnect

This project has two modes. Without valid Supabase credentials it uses the clearly labelled local demo catalogue; it cannot authenticate or create bookings. With credentials, it uses Supabase records and never substitutes demo bookings or authentication for backend data.

## 1. Create a Supabase project

Create a project in the Supabase Dashboard and wait for its database to finish provisioning. Choose a region close to your initial customers. From the project's API settings, copy the project URL and the publishable key. A legacy `anon` key is accepted for compatibility, but a `service_role` or secret key must never be put in this application.

## 2. Configure local environment variables

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Set these values in `.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Expo embeds `EXPO_PUBLIC_` values into the client bundle. The project URL and publishable key are intended for client use only when the database is protected by the provided RLS migration. Do not add service-role keys, database passwords, or other privileged secrets to `.env`, app configuration, or client code. Environment files are ignored by Git; `.env.example` contains placeholders only.

Restart Expo after changing environment variables:

```sh
npx expo start --clear
```

## 3. Apply the database migration

The migration is `supabase/migrations/20261109000000_pujaconnect_marketplace.sql`. It creates the marketplace tables, constraints, indexes, profile sync trigger, booking RPCs, grants, and RLS policies.

With the Supabase CLI installed and Docker available for the local development stack:

```sh
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Alternatively, open the Supabase SQL Editor and run the migration file contents against the project. Apply it before enabling the app's live credentials. The migration intentionally seeds no real or demo marketplace listings.

The security checks are in `supabase/tests/marketplace_security.sql`. Run them against a local Supabase stack with:

```sh
supabase start
supabase test db
```

## 4. Add catalogue data

The app only returns active categories and services. Insert real, reviewed catalogue entries using the Dashboard SQL Editor or an admin-only server. Example:

```sql
with category as (
  insert into public.puja_categories (name, description, active)
  values ('Griha Pravesh', 'Traditional house-entry ceremony', true)
  returning id
)
insert into public.puja_services (
  category_id, name, description, purpose, duration_minutes,
  base_price, samagri_price, languages, included, excluded,
  cancellation_policy, active
)
select id, 'Griha Pravesh Puja', 'A family house-entry ceremony.',
  'Arranged according to the family’s preferred tradition.', 150,
  5100, 1200, array['Hindi', 'Sanskrit'],
  array['Pandit dakshina'], array['Travel outside the service area'],
  'Contact support before the scheduled time.', true
from category;
```

Prices in `puja_services` are the source of truth for new booking requests. Each created booking stores a separate service-price, samagri-price, total-price, and duration snapshot.

## 5. Enable phone OTP and configure SMS

In the Supabase Dashboard, open Authentication settings, enable Phone sign-in, and configure an SMS provider and its credentials. Review the provider's sender requirements, delivery limits, and regional rules. Use a test phone number only if you have configured it in Supabase's phone auth settings. The app calls Supabase `signInWithOtp` and `verifyOtp`; it does not generate or accept fake codes.

If Phone sign-in or SMS delivery is not set up, the sign-in screen will show provider errors and guest browsing remains available. A successful OTP sign-in creates or synchronises the private `profiles` row through the database trigger.

## 6. Register and verify the first pandit

1. Sign in with a phone number that can receive the configured OTP.
2. Open Profile and choose **Create a pandit profile**. Submitting creates a profile with `pending` status. The signed-in user cannot set or edit verification status.
3. Review the profile and identity documents outside the app.
4. In the Supabase SQL Editor, an authorised project administrator can approve the reviewed profile:

```sql
update public.pandit_profiles
set verification_status = 'verified'
where user_id = 'PANDIT_AUTH_USER_UUID'
  and verification_status = 'pending';
```

5. Assign only services the pandit is qualified to perform:

```sql
insert into public.pandit_services (pandit_user_id, service_id)
values ('PANDIT_AUTH_USER_UUID', 'ACTIVE_PUJA_SERVICE_UUID');
```

Only verified public profiles and active service associations are visible to marketplace visitors. For ongoing administration outside the Dashboard, set `app_metadata.role = 'admin'` through a trusted server using the Supabase Admin API. Never set admin claims from user-editable metadata or the mobile client. The migration's admin-only RPC checks this signed app-metadata claim.

## 7. Test a booking request

1. Add at least one active category and service.
2. Create and verify a pandit profile, then associate it with an active service.
3. Sign in as a customer using Phone OTP.
4. Open the service, enter a future date/time, a full address, city, and postal code, then review the price snapshot.
5. Send the request. The app reports success only after `create_booking` returns a saved row with `requested` status. A request is not a confirmed booking and no payment is taken.
6. Sign in as the assigned pandit and accept or decline it in the Pandit dashboard. Accepting an overlapping time is rejected by the database. Customers can cancel an eligible future request; a pandit can mark an accepted booking complete after its scheduled duration has passed.
7. Check the customer's Bookings tab and the booking detail page for the current status and stored price snapshot.

Unassigned customer requests are visible to the customer and an administrator only. They are not exposed to unrelated pandits. An administrator must assign a verified pandit who offers the service before a pandit can view or act on the request.

## 8. Run the application

```sh
npm install
npm start
```

Use a current Expo Go compatible with the project's SDK, or run on an Android/iOS development build. The project also supports web:

```sh
npm run web
```

## Implemented backend features

- Typed Supabase client using the public URL and publishable key, with legacy anon-key fallback
- Mobile session persistence, web local-storage persistence, session restoration, and native foreground token refresh
- Supabase Phone OTP request, verification, resend, and sign-out flows
- Auth user profile synchronisation through a database trigger and self-only profile updates
- Live active category, service, and verified pandit reads; the app does not fall back to demo data when Supabase is configured
- Customer booking creation with database-calculated prices and immutable price snapshots
- Customer booking history and private booking details; pandit actions for assigned requests
- RLS, least-privilege grants, protected verification status, admin-only assignment/verification RPCs, and overlap protection
- Demo mode remains available when credentials are absent

## Manual setup and limitations

- A Supabase project, migration, active catalogue records, and phone SMS provider still need to be configured.
- The first pandit must be reviewed and approved by an administrator. Service associations are managed by an administrator in this milestone.
- No payment provider is integrated. Booking statuses and prices are stored, but no payment is attempted.
- Date/time choices are request preferences, not live availability slots. Conflicts are enforced when an assigned pandit accepts a request.
- Ratings and customer reviews are not stored in this schema; real-data views do not show the sample ratings.
- There is no administrator interface for catalogue, verification, or assignment management; use a trusted server or the Supabase Dashboard.
- SQL policy tests require the Supabase local stack and Docker. No production credentials are included in this repository.
