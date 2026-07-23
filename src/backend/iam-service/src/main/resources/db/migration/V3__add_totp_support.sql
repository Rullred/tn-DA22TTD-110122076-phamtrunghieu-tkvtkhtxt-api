-- Add TOTP (Time-based One-Time Password) support for 2FA
-- This allows users to use Google Authenticator or similar apps

-- Add totp_secret column to store user's TOTP secret key
ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);

-- Add totp_enabled column to track if user has enabled TOTP
ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN nguoi_dung.totp_secret IS 'TOTP secret key for Google Authenticator';
COMMENT ON COLUMN nguoi_dung.totp_enabled IS 'Whether user has enabled TOTP 2FA';
