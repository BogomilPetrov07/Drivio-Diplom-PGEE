CREATE TABLE IF NOT EXISTS "school_join_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_name" text NOT NULL,
  "school_address" text NOT NULL,
  "school_phone" text NOT NULL,
  "contact_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "reviewed_by_user_id" uuid,
  "approved_at" timestamp,
  "setup_token_hash" text,
  "setup_token_expires_at" timestamp,
  "created_school_id" uuid REFERENCES "schools"("id"),
  "created_admin_user_id" uuid,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
