-- Expo push tokens of the learner's mobile devices. A token identifies one app install, so it is
-- unique: signing in with another account on the same device re-assigns the row to that account.
CREATE TABLE push_devices (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users (id),
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_push_devices_token UNIQUE (token)
);

CREATE INDEX idx_push_devices_user ON push_devices (user_id);
