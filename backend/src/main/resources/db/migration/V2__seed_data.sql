-- Seed data for local/dev environments and grading demo.
-- All seed accounts share the password: password
-- (BCrypt hash below is the well-known Spring Security sample hash for "password")

INSERT INTO customers (id, name, contact_email, contact_phone) VALUES
    (1, 'Meridian Facilities Management', 'ops@meridianfm.example', '+1-555-0100'),
    (2, 'Brightline Retail Group', 'facilities@brightline.example', '+1-555-0140');

SELECT setval('customers_id_seq', 2);

INSERT INTO sites (id, customer_id, name, address) VALUES
    (1, 1, 'Meridian HQ Tower', '100 Meridian Way, Springfield'),
    (2, 1, 'Meridian Distribution Center', '250 Logistics Pkwy, Springfield'),
    (3, 2, 'Brightline Store #12', '88 Market St, Rivertown');

SELECT setval('sites_id_seq', 3);

INSERT INTO users (id, name, email, password_hash, role, customer_id) VALUES
    (1, 'Dana Dispatcher',  'dispatcher@keystone.example', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'DISPATCHER', NULL),
    (2, 'Mo Manager',       'manager@keystone.example',    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'MANAGER',    NULL),
    (3, 'Theo Technician',  'tech1@keystone.example',       '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'TECHNICIAN', NULL),
    (4, 'Priya Technician', 'tech2@keystone.example',       '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'TECHNICIAN', NULL),
    (5, 'Cara Customer',    'customer@meridianfm.example',  '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'CUSTOMER',   1);

SELECT setval('users_id_seq', 5);

INSERT INTO parts (id, name, sku, unit_cost, stock_qty) VALUES
    (1, 'HVAC Air Filter 20x25', 'HVAC-AF-2025', 18.50, 40),
    (2, 'Refrigerant R-410A (lb)', 'REF-410A-LB', 12.00, 60),
    (3, 'Circuit Breaker 20A', 'ELEC-CB-20A', 9.75, 25),
    (4, 'Compression Fitting 1/2in', 'PLMB-CF-05', 3.25, 100);

SELECT setval('parts_id_seq', 4);

INSERT INTO work_orders (id, code, title, description, priority, status, customer_id, site_id, assigned_to, sla_due_at, created_by, created_at) VALUES
    (1, 'WO-1001', 'HVAC unit blowing warm air', 'Rooftop unit 3 not cooling. Tenants on 4th floor reporting heat.', 'HIGH', 'IN_PROGRESS', 1, 1, 3, now() + interval '4 hours', 1, now() - interval '1 day'),
    (2, 'WO-1002', 'Flickering lights in warehouse bay 2', 'Intermittent flicker, possible breaker issue.', 'MEDIUM', 'ASSIGNED', 1, 2, 4, now() + interval '1 day', 1, now() - interval '6 hours'),
    (3, 'WO-1003', 'Leaking pipe under break room sink', 'Steady drip reported by staff this morning.', 'URGENT', 'NEW', 2, 3, NULL, now() + interval '2 hours', 5, now() - interval '2 hours'),
    (4, 'WO-1004', 'Quarterly HVAC filter replacement', 'Scheduled preventive maintenance.', 'LOW', 'COMPLETED', 1, 1, 3, now() - interval '1 day', 1, now() - interval '5 day');

SELECT setval('work_orders_id_seq', 4);

INSERT INTO work_order_status_history (work_order_id, from_status, to_status, changed_by, changed_at, note) VALUES
    (1, NULL, 'NEW', 1, now() - interval '1 day', 'Request logged by dispatcher'),
    (1, 'NEW', 'ASSIGNED', 1, now() - interval '23 hours', 'Assigned to Theo'),
    (1, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '20 hours', 'Started diagnostics'),
    (2, NULL, 'NEW', 1, now() - interval '6 hours', 'Request logged by dispatcher'),
    (2, 'NEW', 'ASSIGNED', 1, now() - interval '5 hours', 'Assigned to Priya'),
    (3, NULL, 'NEW', 5, now() - interval '2 hours', 'Submitted via customer portal'),
    (4, NULL, 'NEW', 1, now() - interval '5 day', 'Scheduled maintenance'),
    (4, 'NEW', 'ASSIGNED', 1, now() - interval '5 day', 'Assigned to Theo'),
    (4, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '2 day', 'Started'),
    (4, 'IN_PROGRESS', 'COMPLETED', 3, now() - interval '1 day', 'Filters replaced');

INSERT INTO part_usage (work_order_id, part_id, qty_used, logged_by, logged_at) VALUES
    (4, 1, 2, 3, now() - interval '1 day');

INSERT INTO time_logs (work_order_id, technician_id, minutes, note, logged_at) VALUES
    (1, 3, 45, 'Initial diagnostics', now() - interval '19 hours'),
    (4, 3, 30, 'Filter swap', now() - interval '1 day');
