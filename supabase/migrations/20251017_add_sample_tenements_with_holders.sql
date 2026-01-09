-- Add sample tenements with real holder names for testing
-- This will populate the database with realistic mining company data

INSERT INTO public.tenements (
    jurisdiction, 
    number, 
    type, 
    status, 
    holder_name, 
    grant_date, 
    expiry_date, 
    area_ha,
    last_sync_at
) VALUES 
-- Northern Star Resources Ltd (WA Gold)
('WA', 'M15/1789', 'Mining Lease', 'Live', 'Northern Star Resources Ltd', '2020-06-15', '2025-06-15', 1250.50, NOW()),
('WA', 'M15/1790', 'Mining Lease', 'Live', 'Northern Star Resources Ltd', '2021-03-20', '2026-03-20', 980.25, NOW()),
('WA', 'E15/1234', 'Exploration Licence', 'Live', 'Northern Star Resources Ltd', '2020-12-10', '2025-12-10', 5000.00, NOW()),
('WA', 'M15/1791', 'Mining Lease', 'Live', 'Northern Star Resources Ltd', '2019-08-05', '2024-08-05', 750.75, NOW()),
('WA', 'E15/1235', 'Exploration Licence', 'Live', 'Northern Star Resources Ltd', '2022-01-15', '2027-01-15', 3200.00, NOW()),

-- Newcrest Mining Limited (Multi-jurisdiction)
('WA', 'M26/456', 'Mining Lease', 'Live', 'Newcrest Mining Limited', '2018-05-10', '2025-05-10', 2100.00, NOW()),
('NSW', 'ML1678', 'Mining Lease', 'Current', 'Newcrest Mining Limited', '2019-09-22', '2026-09-22', 1850.50, NOW()),
('VIC', 'MIN5234', 'Mining Licence', 'Current', 'Newcrest Mining Limited', '2020-11-08', '2025-11-08', 920.25, NOW()),

-- BHP Billiton Ltd (Iron Ore)
('WA', 'M47/1234', 'Mining Lease', 'Live', 'BHP Billiton Ltd', '2015-03-12', '2025-03-12', 15000.00, NOW()),
('WA', 'M47/1235', 'Mining Lease', 'Live', 'BHP Billiton Ltd', '2016-07-18', '2026-07-18', 12500.75, NOW()),
('QLD', 'MDL234', 'Mineral Development Licence', 'Current', 'BHP Billiton Ltd', '2017-11-25', '2024-11-25', 8900.50, NOW()),

-- Rio Tinto Limited (Iron Ore)
('WA', 'M118/789', 'Mining Lease', 'Live', 'Rio Tinto Limited', '2014-02-28', '2025-02-28', 18500.00, NOW()),
('NT', 'MLN456', 'Mineral Lease', 'Current', 'Rio Tinto Limited', '2016-06-14', '2026-06-14', 22000.25, NOW()),
('NT', 'ELN789', 'Exploration Licence', 'Current', 'Rio Tinto Limited', '2021-04-20', '2026-04-20', 45000.00, NOW()),

-- Fortescue Metals Group Ltd (Iron Ore)
('WA', 'M274/123', 'Mining Lease', 'Live', 'Fortescue Metals Group Ltd', '2013-12-05', '2024-12-05', 25000.00, NOW()),
('WA', 'E47/5678', 'Exploration Licence', 'Live', 'Fortescue Metals Group Ltd', '2020-08-30', '2025-08-30', 15000.50, NOW()),
('WA', 'M47/1236', 'Mining Lease', 'Live', 'Fortescue Metals Group Ltd', '2018-10-12', '2025-10-12', 8750.25, NOW()),

-- Evolution Mining Limited (Gold)
('NSW', 'ML1234', 'Mining Lease', 'Current', 'Evolution Mining Limited', '2017-01-18', '2025-01-18', 1200.00, NOW()),
('NSW', 'EL5678', 'Exploration Licence', 'Current', 'Evolution Mining Limited', '2019-05-22', '2024-05-22', 3500.75, NOW()),
('QLD', 'ML20567', 'Mining Lease', 'Current', 'Evolution Mining Limited', '2020-09-15', '2025-09-15', 2100.50, NOW()),

-- Sandfire Resources NL (Copper)
('WA', 'M52/1111', 'Mining Lease', 'Live', 'Sandfire Resources NL', '2019-03-08', '2024-03-08', 950.25, NOW()),
('WA', 'E52/2222', 'Exploration Licence', 'Live', 'Sandfire Resources NL', '2021-07-14', '2026-07-14', 4200.00, NOW()),

-- Pilbara Minerals Limited (Lithium)
('WA', 'M45/1000', 'Mining Lease', 'Live', 'Pilbara Minerals Limited', '2018-11-20', '2025-11-20', 1800.50, NOW()),
('WA', 'E45/2000', 'Exploration Licence', 'Live', 'Pilbara Minerals Limited', '2020-02-28', '2025-02-28', 6500.25, NOW()),

-- Goldfields Limited (Gold)
('WA', 'M70/1234', 'Mining Lease', 'Live', 'Goldfields Limited', '2016-04-12', '2024-04-12', 1100.75, NOW()),
('WA', 'E70/5678', 'Exploration Licence', 'Live', 'Goldfields Limited', '2019-08-05', '2024-08-05', 2800.00, NOW()),
('WA', 'M70/1235', 'Mining Lease', 'Live', 'Goldfields Limited', '2020-12-18', '2025-12-18', 650.50, NOW()),

-- Smaller operators
('VIC', 'EL6789', 'Exploration Licence', 'Current', 'Stawell Gold Mines Pty Ltd', '2021-06-10', '2026-06-10', 1200.00, NOW()),
('NSW', 'EL8901', 'Exploration Licence', 'Current', 'Broken Hill Prospecting Ltd', '2020-03-25', '2025-03-25', 800.25, NOW()),
('QLD', 'EPM567', 'Exploration Permit', 'Current', 'Mount Isa Mines Limited', '2019-11-30', '2024-11-30', 5500.75, NOW()),
('NT', 'ELN234', 'Exploration Licence', 'Current', 'Tanami Gold NL', '2021-01-08', '2026-01-08', 12000.50, NOW()),
('WA', 'P15/6789', 'Prospecting Licence', 'Live', 'Kalgoorlie Consolidated Gold Mines Pty Ltd', '2022-05-15', '2026-05-15', 150.25, NOW())

ON CONFLICT (jurisdiction, number) DO UPDATE SET
    holder_name = EXCLUDED.holder_name,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    grant_date = EXCLUDED.grant_date,
    expiry_date = EXCLUDED.expiry_date,
    area_ha = EXCLUDED.area_ha,
    last_sync_at = EXCLUDED.last_sync_at;
