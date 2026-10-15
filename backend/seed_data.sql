-- Sample records for local development.
-- Run this once against a database that has the current events/bookings schema.
-- Event dates are stored as UTC; booking_date uses SQLite's current UTC timestamp.

BEGIN;

INSERT INTO events (name, description, total_seats, available_seats, date)
VALUES
    (
        'Sample Music Festival',
        'An outdoor evening of live music.',
        100,
        98,
        '2026-11-14 18:00:00'
    ),
    (
        'Sample Technology Conference',
        'Talks and workshops for software developers.',
        50,
        50,
        '2026-11-20 09:00:00'
    ),
    (
        'Sample Community Workshop',
        'A hands-on introduction to community gardening.',
        20,
        19,
        '2026-11-28 10:00:00'
    );

INSERT INTO bookings (
    event_id, user_name, quantity, attendee_names, seat_numbers, booking_date
)
VALUES
    (
        (SELECT id FROM events WHERE name = 'Sample Music Festival'),
        'Alex Morgan',
        1,
        '["Alex Morgan"]',
        '[1]',
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT id FROM events WHERE name = 'Sample Music Festival'),
        'Jamie Lee',
        1,
        '["Jamie Lee"]',
        '[2]',
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT id FROM events WHERE name = 'Sample Community Workshop'),
        'Taylor Kim',
        1,
        '["Taylor Kim"]',
        '[1]',
        CURRENT_TIMESTAMP
    );

COMMIT;
