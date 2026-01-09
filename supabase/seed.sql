-- Seed data for Mining Hub local development

-- Insert sample users (these will be created in auth.users by Supabase Auth)
-- We'll create the corresponding public.users records

-- First, let's insert some auth users (this would normally be done via Supabase Auth)
-- For local development, we'll create them directly

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000',
    'admin@hethetrack.com',
    crypt('TestAdmin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Sarah Mitchell", "user_type": "platform_admin", "company": "HetheTrack"}',
    false,
    'authenticated'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000',
    'consultant@hetherington.com.au',
    crypt('TestConsultant123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "James Thompson", "user_type": "business_user", "company": "Hetherington Mining Consultants"}',
    false,
    'authenticated'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '00000000-0000-0000-0000-000000000000',
    'client@miningcorp.com.au',
    crypt('TestClient123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Michael Chen", "user_type": "client", "company": "Australian Mining Corp"}',
    false,
    'authenticated'
);

-- Insert corresponding public.users records
INSERT INTO public.users (id, email, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@hethetrack.com', 'Sarah Mitchell', 'Administrator'),
('550e8400-e29b-41d4-a716-446655440002', 'consultant@hetherington.com.au', 'James Thompson', 'Consultant'),
('550e8400-e29b-41d4-a716-446655440003', 'client@miningcorp.com.au', 'Michael Chen', 'Consultant');

-- Insert sample tenements
INSERT INTO public.tenements (
    id,
    jurisdiction,
    number,
    type,
    status,
    holder_name,
    application_date,
    grant_date,
    expiry_date,
    anniversary_date,
    area_ha,
    section29_flag,
    consultant_user_id
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440101',
    'WA',
    'M77/1234',
    'Mining Lease',
    'Granted',
    'Hetherington Mining Pty Ltd',
    '2020-01-15',
    '2021-03-20',
    '2025-03-20',
    '2024-03-20',
    1250.5,
    true,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'WA',
    'E77/2345',
    'Exploration Licence',
    'Granted',
    'Western Exploration Ltd',
    '2021-06-10',
    '2022-01-15',
    '2027-01-15',
    '2025-01-15',
    5000.0,
    false,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    'WA',
    'P77/3456',
    'Prospecting Licence',
    'Granted',
    'Gold Rush Prospecting',
    '2022-03-01',
    '2022-08-15',
    '2026-08-15',
    '2024-08-15',
    200.0,
    false,
    '550e8400-e29b-41d4-a716-446655440003'
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    'WA',
    'M77/4567',
    'Mining Lease',
    'Application',
    'Future Mining Corp',
    '2023-09-01',
    NULL,
    NULL,
    NULL,
    800.0,
    false,
    '550e8400-e29b-41d4-a716-446655440003'
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    'WA',
    'E77/5678',
    'Exploration Licence',
    'Granted',
    'Deep Earth Resources',
    '2020-11-20',
    '2021-05-10',
    '2024-12-31',
    '2024-05-10',
    3500.0,
    true,
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Insert sample actions
INSERT INTO public.actions (
    id,
    tenement_id,
    type,
    title,
    due_date,
    amount,
    status,
    assigned_to_user_id,
    source,
    notes
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440101',
    'Anniversary',
    'Anniversary renewal due',
    '2024-03-20',
    NULL,
    'Open',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440101',
    'RentDue',
    'Annual rent payment',
    '2024-02-20',
    5000.00,
    'Open',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440101',
    'Section29',
    'Section 29 compliance report',
    '2024-06-20',
    NULL,
    'Open',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440204',
    '550e8400-e29b-41d4-a716-446655440102',
    'Anniversary',
    'Anniversary renewal due',
    '2025-01-15',
    NULL,
    'Open',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440103',
    'Anniversary',
    'Anniversary renewal due',
    '2024-08-15',
    NULL,
    'Snoozed',
    '550e8400-e29b-41d4-a716-446655440003',
    'System',
    'Waiting for geological survey completion'
),
(
    '550e8400-e29b-41d4-a716-446655440206',
    '550e8400-e29b-41d4-a716-446655440105',
    'Anniversary',
    'Anniversary renewal due',
    '2024-05-10',
    NULL,
    'Done',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440207',
    '550e8400-e29b-41d4-a716-446655440105',
    'Section29',
    'Section 29 compliance report',
    '2024-08-10',
    NULL,
    'Open',
    '550e8400-e29b-41d4-a716-446655440002',
    'System',
    NULL
),
(
    '550e8400-e29b-41d4-a716-446655440208',
    '550e8400-e29b-41d4-a716-446655440104',
    'AdHoc',
    'Follow up on application status',
    '2024-01-15',
    NULL,
    'Open',
    '550e8400-e29b-41d4-a716-446655440003',
    'Manual',
    'Check with DMIRS on processing timeline'
);

-- Insert sample due diligence run
INSERT INTO public.due_diligence_runs (
    id,
    created_by_user_id,
    tenement_ids,
    template_key,
    status,
    output_uri
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440002',
    '["550e8400-e29b-41d4-a716-446655440101", "550e8400-e29b-41d4-a716-446655440102"]',
    'dd_default.xlsx',
    'Succeeded',
    'http://127.0.0.1:54321/storage/v1/object/public/exports/sample-report.xlsx'
);
