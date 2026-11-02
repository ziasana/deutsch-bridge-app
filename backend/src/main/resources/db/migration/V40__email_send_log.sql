-- History of admin-triggered test emails, so the outcome (and the exact SMTP failure, if any)
-- can be reviewed after the fact from Admin > Settings > Email Testing.
CREATE TABLE email_send_logs (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id VARCHAR(255),
    email_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_category VARCHAR(40),
    error_message VARCHAR(2000),
    error_detail VARCHAR(4000),
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    from_address VARCHAR(255),
    duration_ms BIGINT NOT NULL,
    sent_by_admin_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_email_send_logs_created_at ON email_send_logs (created_at DESC);
