begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'pandit_profiles', 'pandit profiles exist');
select has_table('public', 'puja_categories', 'puja categories exist');
select has_table('public', 'puja_services', 'puja services exist');
select has_table('public', 'pandit_services', 'pandit services exist');
select has_table('public', 'bookings', 'bookings exist');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profile RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.pandit_profiles'::regclass), 'pandit profile RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.puja_categories'::regclass), 'category RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.puja_services'::regclass), 'service RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.pandit_services'::regclass), 'pandit service RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.bookings'::regclass), 'booking RLS is enabled');

select ok(not has_table_privilege('anon', 'public.bookings', 'select'), 'anonymous users cannot read private booking rows');
select ok(not has_table_privilege('anon', 'public.bookings', 'insert'), 'anonymous users cannot create bookings');
select ok(not has_table_privilege('authenticated', 'public.bookings', 'insert'), 'authenticated users must use the secure booking function');
select ok(not has_column_privilege('authenticated', 'public.bookings', 'total_price', 'update'), 'customers cannot update booking price snapshots');
select ok(not has_column_privilege('authenticated', 'public.pandit_profiles', 'verification_status', 'update'), 'pandits cannot update verification status');

select ok(has_function_privilege('authenticated', 'public.create_booking(uuid,timestamptz,text,text,text,text,boolean,uuid,text)', 'execute'), 'authenticated users can request a booking through the database function');
select ok(not has_function_privilege('anon', 'public.create_booking(uuid,timestamptz,text,text,text,text,boolean,uuid,text)', 'execute'), 'anonymous users cannot invoke booking creation');

select has_policy('public', 'profiles', 'profiles_read_self', 'customers have a self-profile read policy');
select has_policy('public', 'profiles', 'profiles_update_self', 'customers have a self-profile update policy');
select has_policy('public', 'pandit_profiles', 'pandit_profiles_read_verified', 'public pandit profile reads require verification');
select has_policy('public', 'pandit_profiles', 'pandit_profiles_insert_pending_self', 'pandit self-registration starts pending');
select has_policy('public', 'puja_categories', 'puja_categories_read_active', 'only active categories are public');
select has_policy('public', 'puja_services', 'puja_services_read_active', 'only active services are public');
select has_policy('public', 'pandit_services', 'pandit_services_read_public_verified', 'public service links require verified pandits');
select has_policy('public', 'bookings', 'bookings_read_customer_or_assigned_pandit', 'booking reads are limited to their customer, assigned pandit, or administrator');

select * from finish();

rollback;

